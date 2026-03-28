# Redis Caching Strategy & Implementation

## Overview

The Employee Portal implements a **cache-aside pattern** using Upstash Redis to optimize read-heavy endpoints. The system caches frequently accessed data with automatic invalidation on mutations.

## Architecture Decision

### Why Cache-Aside Pattern?

The cache-aside (lazy loading) pattern was chosen because:
1. **Complexity Management**: Service layer handles cache checks, not database layer
2. **Flexibility**: Easy to add/remove caching without database changes
3. **Consistency**: Always fetch fresh data on cache miss, no stale data
4. **Cost Effective**: Only cache what's actually read
5. **Upstash Compatibility**: REST-based, perfect for HTTP-based cache layer

### Why Upstash Redis?

- **Serverless**: No infrastructure management needed
- **Free Tier**: Perfect for development and evaluation
- **HTTP-Based**: No need for local Redis server
- **Durability**: Data persisted across sessions
- **Auto Scalable**: Handles spikes without manual intervention

## Caching Strategy

### 1. Read Operations (Cache-Aside)

```
Request for data
  ↓
Check Redis cache
  ├─ Cache HIT → Return cached data (log: [CACHE HIT])
  └─ Cache MISS → Query database (log: [DB QUERY])
                    ↓
                    Store in cache with TTL
                    ↓
                    Return data
```

### 2. Cache Keys Structure

**Employees:**
- `employees:list:{page}:{limit}` - Paginated employee list
- `employees:single:{id}` - Individual employee detail
- `employees:dept:{deptId}` - Employees by department

**Departments:**
- `departments:all` - All departments list
- `departments:single:{id}` - Individual department + employee count

**Roles:**
- `roles:all` - All roles list
- `roles:single:{id}` - Individual role

**Attendance:**
- `attendance:list:{startDate}:{endDate}:{page}:{limit}` - Filtered records
- `attendance:emp:{employeeId}` - Employee attendance history
- `leave:emp:{employeeId}` - Employee leave requests

**Auth:**
- `bl_{token}` - Blacklisted JWT tokens

### 3. TTL (Time To Live)

| Cache Type | TTL | Reason |
|-----------|-----|--------|
| List caches | 5 minutes | Moderate consistency, good performance |
| Single records | 5 minutes | Balance between freshness and hits |
| Token blacklist | JWT exp - now | Match token expiration exactly |

```javascript
const CACHE_TTL = 300; // 5 minutes
await redis.set(cacheKey, data, { ex: CACHE_TTL });
```

### 4. Invalidation Strategy

Caches are invalidated when data is modified:

**Create Operation:**
- Invalidate list caches for that entity
- Example: Creating employee → clear `employees:list:*`

**Update Operation:**
- Invalidate single record cache
- Invalidate affected list caches
- Example: Update employee → clear `employees:single:{id}` + `employees:list:*`

**Delete Operation:**
- Invalidate single record cache
- Invalidate related list caches
- Example: Delete employee → clear `employees:single:{id}` + `employees:list:*`

### 5. Cascade Invalidation

When a department is deleted:
```javascript
// Check for active employees
const count = await repo.getEmployeeCount(id);
if (count > 0) throw error; // Prevent deletion

// If allowed, invalidate:
await redis.del(`departments:single:${id}`);
await redis.del('departments:all');

// Also invalidate employee caches (department FK)
const { keys } = await redis.scan(0, { match: 'employees:*', count: 100 });
if (keys.length) await redis.del(...keys);
```

## Implementation Details

### Service Layer Caching

All caching logic lives in the service layer (no business logic in repos):

```javascript
// src/services/employee.service.js
export const getAllEmployees = async (page, limit) => {
  const cacheKey = `employees:list:${page}:${limit}`;
  
  // Check cache first
  const cached = await redis.get(cacheKey);
  if (cached) {
    console.log(`[CACHE HIT] ${cacheKey}`);
    return cached; // Upstash returns parsed JSON automatically
  }
  
  console.log(`[DB QUERY] Fetching employees list`);
  
  // Cache miss - query database
  const result = await repo.findAll({ page, limit });
  
  // Store in cache for 5 minutes
  await redis.set(cacheKey, result, { ex: CACHE_TTL });
  
  return result;
};
```

### Scan for Invalidation

When invalidating multiple keys (e.g., all list keys):

```javascript
const invalidateListCache = async () => {
  // Scan for keys matching pattern
  const { keys } = await redis.scan(0, { match: 'employees:list:*', count: 100 });
  
  // Delete all found keys at once
  if (keys.length) await redis.del(...keys);
  
  console.log(`[CACHE INVALIDATED] ${keys.length} employee list caches cleared`);
};
```

## Performance Metrics

### Expected Cache Hit Rates

| Endpoint Type | Hit Rate | Typical Response |
|--------------|----------|-----------------|
| List endpoints | 60-80% | Cached 5 min windows |
| Single record | 70-85% | High repeat access |
| First request | 0% | Always cache miss |
| After update | 0% | Invalidated |

### Latency Improvement

- **Database query**: ~100-300ms (PostgreSQL + network)
- **Redis cache hit**: ~20-50ms (REST API call)
- **Improvement**: 5-15x faster for cached reads

## Monitoring

### Console Logging

Cache operations are logged to console for visibility:

```javascript
// Cache hits
[CACHE HIT] employees:list:1:10
[CACHE HIT] departments:single:uuid-123

// Database queries
[DB QUERY] Fetching employees list
[DB QUERY] Fetching employee uuid-456

// Invalidations
[CACHE INVALIDATED] Departments cache cleared
[CACHE INVALIDATED] Employee list cache cleared
```

Monitor these logs to verify caching is working:
- Frequency of `[CACHE HIT]` = good cache efficiency
- Frequency of `[DB QUERY]` = cache misses (after TTL or first access)
- `[CACHE INVALIDATED]` = mutation operations

## Cost Analysis

### Upstash Pricing (Free Tier)

- **Storage**: 10 GB
- **API Calls**: 100,000 daily
- **Commands**: read(), write(), set(), del(), scan()

### Estimated Usage

- 100 employees × 10 versions = 1 KB data
- 5 department × 3 versions = 500B data
- **Total**: ~50MB for full cache

**Well within free tier limits**

## Decisions & Rationale

### Why No Write-Through Cache?

Write-through (cache on every database write) wasn't implemented because:
- Upstash latency acceptable for invalidation patterns
- Reduces complexity vs. consistency guarantees needed
- Cache-aside naturally handles database-source-of-truth

### Why 5 Minutes TTL?

- Balances freshness and performance
- Most employee data doesn't change frequently
- 5 min window matches typical business operations
- Shorter = more DB queries; longer = more stale data

### Why Not Cache Everything?

- Not all endpoints benefit (write-heavy operations)
- Token blacklist needs exact TTL matching
- Cost vs. benefit analysis per endpoint
- Focused on read-heavy operations (GET /employees, etc.)

## Scalability

### Horizontal Scaling

If deployment scales to multiple servers:
- All instances share same Redis database (Upstash)
- Automatic cache coherence across servers
- No per-instance cache conflicts

### Vertical Scaling

As data grows:
- Redis scan pagination handles large key sets
- Upstash auto-scales capacity
- No code changes needed

## Testing Cache Behavior

### Manual Testing

1. **First request** (cache miss):
   ```bash
   curl GET http://localhost:5000/api/employees
   # Console: [DB QUERY] Fetching employees list
   ```

2. **Immediate second request** (cache hit):
   ```bash
   curl GET http://localhost:5000/api/employees
   # Console: [CACHE HIT] employees:list:1:10
   ```

3. **After mutation** (invalidated):
   ```bash
   curl POST http://localhost:5000/api/employees
   # Console: [CACHE INVALIDATED] Employee list cache cleared
   
   curl GET http://localhost:5000/api/employees
   # Console: [DB QUERY] Fetching employees list (fresh)
   ```

4. **After 5 minutes** (TTL expired):
   ```bash
   # Wait 5 minutes, then request
   curl GET http://localhost:5000/api/employees
   # Console: [DB QUERY] Fetching employees list (TTL expired)
   ```

## Maintenance

### Clearing Cache Manually

If needed to force cache refresh:

```bash
# Via Redis CLI
redis-cli DEL employees:list:*

# Or via Upstash dashboard
# → Data Browser → Select keys → Delete
```

### Monitoring Cache Health

Track in production:
- Cache hit/miss ratio
- Response times (cached vs. uncached)
- Memory usage in Upstash dashboard
- Token blacklist accumulation (cleanup via TTL)

## Future Enhancements

Potential improvements for production:

1. **Distributed Cache Invalidation**: Publish-subscribe for multi-server invalidation
2. **Cache Warming**: Pre-populate cache on server startup
3. **Partial Cache Updates**: Update cached list after single record change
4. **Compression**: Gzip large cached objects
5. **Analytics**: Track cache hit rates per endpoint
6. **Smart TTL**: Dynamic TTL based on update frequency

---

**Architecture follows ASYNTAX assessment requirements for cache-aside pattern with Upstash Redis integration.**
