const apiBase = `${window.location.origin}/api`;
const alertEl = document.getElementById('alert');

const sections = {
  auth: document.getElementById('authSection'),
  employees: document.getElementById('employeesSection'),
  departments: document.getElementById('departmentsSection'),
  roles: document.getElementById('rolesSection')
};

const showSection = (name) => {
  Object.values(sections).forEach(s => s.style.display = 'none');
  sections[name].style.display = 'block';
};

const showMessage = (msg, isError = false) => {
  alertEl.style.display = 'block';
  alertEl.className = isError ? 'alert error' : 'alert';
  alertEl.innerText = msg;
  setTimeout(() => alertEl.style.display = 'none', 3500);
};

const getToken = () => localStorage.getItem('employee_portal_token');
const setToken = token => localStorage.setItem('employee_portal_token', token);
const clearToken = () => localStorage.removeItem('employee_portal_token');
const isLoggedIn = () => !!getToken();

const authHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${getToken()}`
});

const apiRequest = async (path, method = 'GET', body) => {
  const options = { method, headers: authHeaders() };
  if (body !== undefined) options.body = JSON.stringify(body);
  const res = await fetch(`${apiBase}${path}`, options);
  const text = await res.text();
  let json = null;
  if (text) {
    try { json = JSON.parse(text); } catch (err) {
      console.error('Invalid JSON:', text.slice(0, 200));
      throw new Error('Invalid server response');
    }
  }
  if (!res.ok) {
    throw new Error(json?.message || json?.error || `HTTP ${res.status}`);
  }
  return json?.data ?? json;
};

const updateAuthUI = () => {
  const loggedIn = isLoggedIn();
  document.getElementById('logoutBtn').style.display = loggedIn ? 'inline-block' : 'none';
  document.getElementById('loginBtn').style.display = loggedIn ? 'none' : 'inline-block';
  document.getElementById('registerBtn').style.display = loggedIn ? 'none' : 'inline-block';
  Object.keys(sections).forEach(k => {
    if (k !== 'auth') sections[k].style.display = loggedIn ? 'block' : 'none';
  });
  if (!loggedIn) showSection('auth');
};

const id = (id) => document.getElementById(id);

// ========== AUTH HANDLERS ==========
const registerAction = async () => {
  try {
    const name = id('name').value.trim();
    const email = id('email').value.trim();
    const password = id('authPassword').value.trim();
    if (!name || !email || !password) return showMessage('Provide name/email/password', true);
    await apiRequest('/auth/register', 'POST', { name, email, password });
    showMessage('✅ Registered successfully. Please login.');
    id('name').value = '';
    id('email').value = '';
    id('authPassword').value = '';
  } catch (err) { showMessage('❌ Register failed: ' + err.message, true); }
};

const loginAction = async () => {
  try {
    const email = id('email').value.trim();
    const password = id('authPassword').value.trim();
    if (!email || !password) return showMessage('Provide email/password', true);
    const data = await apiRequest('/auth/login', 'POST', { email, password });
    setToken(data.token);
    updateAuthUI();
    await loadAll();
    showMessage('✅ Login successful');
  } catch (err) { showMessage('❌ Login failed: ' + err.message, true); }
};

const logoutAction = async () => {
  try { await apiRequest('/auth/logout', 'POST'); } catch (err) { console.warn(err); }
  clearToken();
  updateAuthUI();
  showMessage('✅ Logged out');
};

// ========== RENDER TABLE HELPER ==========
const renderTable = (containerId, columns, rows) => {
  const html = [`<table><thead><tr>${columns.map(c => `<th>${c}</th>`).join('')}</tr></thead><tbody>`];
  rows.forEach(r => html.push('<tr>' + r.map(c => `<td>${c}</td>`).join('') + '</tr>'));
  html.push('</tbody></table>');
  document.getElementById(containerId).innerHTML = html.join('');
};

// ========== EMPLOYEES CRUD ==========
const loadEmployees = async () => {
  try {
    let rows = await apiRequest('/employees');
    if (!Array.isArray(rows)) rows = rows.data || [];
    const term = id('empSearch').value.trim().toLowerCase();
    if (term) rows = rows.filter(e => `${e.first_name} ${e.last_name} ${e.email}`.toLowerCase().includes(term));
    
    const tableRows = rows.map(emp => {
      const action = `<button onclick="editEmployee('${emp.id}')">✏️ Edit</button> <button onclick="deleteEmployee('${emp.id}')" class='danger'>🗑️ Delete</button>`;
      const hireDate = emp.hire_date ? new Date(emp.hire_date).toLocaleDateString('en-GB') : '-';
      return [emp.id.slice(0,8), emp.first_name, emp.last_name, emp.email, emp.phone || '-', emp.department_id?.slice(0,8) || '-', emp.role_id?.slice(0,8) || '-', hireDate, emp.salary, emp.is_active ? '✓' : '✗', action];
    });
    renderTable('employeeTable', ['ID','First','Last','Email','Phone','DeptID','RoleID','HireDate','Salary','Active','Action'], tableRows);
  } catch (err) { showMessage('❌ Load employees failed: ' + err.message, true); }
};

const createEmployee = async () => {
  try {
    const emp = {
      first_name: id('firstName').value.trim(),
      last_name: id('lastName').value.trim(),
      email: id('employeeEmail').value.trim(),
      phone: id('phone').value.trim() || undefined,
      department_id: id('departmentId').value,
      role_id: id('roleId').value,
      hire_date: id('hireDate').value || new Date().toISOString().slice(0, 10),
      salary: Number(id('salary').value)
    };
    if (!emp.first_name || !emp.last_name || !emp.email || !emp.department_id || !emp.role_id || !emp.salary) 
      return showMessage('❌ Complete all required fields (*)', true);
    await apiRequest('/employees', 'POST', emp);
    showMessage('✅ Employee created');
    id('firstName').value = '';
    id('lastName').value = '';
    id('employeeEmail').value = '';
    id('phone').value = '';
    id('departmentId').value = '';
    id('roleId').value = '';
    id('hireDate').value = '';
    id('salary').value = '';
    await loadEmployees();
  } catch (err) { showMessage('❌ Create failed: ' + err.message, true); }
};

window.editEmployee = async (empId) => {
  const newSalary = prompt('✏️ Enter new salary (or leave blank to skip):');
  if (newSalary === null) return;
  try {
    const payload = {};
    if (newSalary.trim()) payload.salary = Number(newSalary);
    if (!Object.keys(payload).length) return;
    await apiRequest(`/employees/${empId}`, 'PUT', payload);
    showMessage('✅ Employee updated');
    await loadEmployees();
  } catch (err) { showMessage('❌ Edit failed: ' + err.message, true); }
};

window.deleteEmployee = async (empId) => {
  if (!confirm('⚠️ Deactivate this employee?')) return;
  try {
    await apiRequest(`/employees/${empId}`, 'DELETE');
    showMessage('✅ Employee deactivated');
    await loadEmployees();
  } catch (err) { showMessage('❌ Delete failed: ' + err.message, true); }
};

// ========== DEPARTMENTS CRUD ==========
const loadDepartments = async () => {
  try {
    const depts = await apiRequest('/departments');
    const deptList = Array.isArray(depts) ? depts : depts.data || [];
    
    const rows = deptList.map(d => {
      const action = `<button onclick="editDept('${d.id}')">✏️ Edit</button> <button onclick="deleteDept('${d.id}')" class='danger'>🗑️ Delete</button>`;
      return [d.id.slice(0,8), d.name, d.description || '-', d.manager_id?.slice(0,8) || '-', action];
    });
    renderTable('deptTable', ['ID','Name','Description','ManagerID','Action'], rows);
    
    id('departmentId').innerHTML = '<option value="">Select Department</option>' + deptList.map(d => `<option value="${d.id}">${d.name}</option>`).join('');
    id('roleDept').innerHTML = '<option value="">Optional - Select Department</option>' + deptList.map(d => `<option value="${d.id}">${d.name}</option>`).join('');
    
    const empList = await apiRequest('/employees');
    const emps = Array.isArray(empList) ? empList : empList.data || [];
    id('deptManager').innerHTML = '<option value="">None / Select Manager</option>' + emps.map(e => `<option value="${e.id}">${e.first_name} ${e.last_name}</option>`).join('');
  } catch (err) { showMessage('❌ Load departments failed: ' + err.message, true); }
};

const createDepartment = async () => {
  try {
    const name = id('deptName').value.trim();
    const description = id('deptDesc').value.trim() || undefined;
    const manager_id = id('deptManager').value || undefined;
    if (!name) return showMessage('❌ Provide department name', true);
    await apiRequest('/departments', 'POST', { name, description, manager_id });
    showMessage('✅ Department created');
    id('deptName').value = '';
    id('deptDesc').value = '';
    id('deptManager').value = '';
    await loadDepartments();
    await loadEmployees();
  } catch (err) { showMessage('❌ Create dept failed: ' + err.message, true); }
};

window.editDept = async (deptId) => {
  const newName = prompt('✏️ Enter new department name:');
  if (newName === null) return;
  try {
    await apiRequest(`/departments/${deptId}`, 'PUT', { name: newName });
    showMessage('✅ Department updated');
    await loadDepartments();
  } catch (err) { showMessage('❌ Edit dept failed: ' + err.message, true); }
};

window.deleteDept = async (deptId) => {
  if (!confirm('⚠️ Delete this department?')) return;
  try {
    await apiRequest(`/departments/${deptId}`, 'DELETE');
    showMessage('✅ Department deleted');
    await loadDepartments();
  } catch (err) { showMessage('❌ Delete dept failed: ' + err.message, true); }
};

// ========== ROLES CRUD ==========
const loadRoles = async () => {
  try {
    const roles = await apiRequest('/roles');
    const roleList = Array.isArray(roles) ? roles : roles.data || [];
    
    const rows = roleList.map(r => {
      const action = `<button onclick="editRole('${r.id}')">✏️ Edit</button> <button onclick="deleteRole('${r.id}')" class='danger'>🗑️ Delete</button>`;
      const deptId = r.department_id ? r.department_id.slice(0,8) : '-';
      return [r.id.slice(0,8), r.title || r.name || '', deptId, r.min_salary || '-', r.max_salary || '-', r.level || '-', action];
    });
    renderTable('roleTable', ['ID','Title','DeptID','MinSal','MaxSal','Level','Action'], rows);
    
    id('roleId').innerHTML = '<option value="">Select Role</option>' + roleList.map(r => `<option value="${r.id}">${r.title || r.name || ''}</option>`).join('');
  } catch (err) { showMessage('❌ Load roles failed: ' + err.message, true); }
};

const createRole = async () => {
  try {
    const title = id('roleTitle').value.trim();
    const department_id = id('roleDept').value || undefined;
    const min_salary = id('roleMinSal').value ? Number(id('roleMinSal').value) : undefined;
    const max_salary = id('roleMaxSal').value ? Number(id('roleMaxSal').value) : undefined;
    const level = id('roleLevel').value || undefined;
    
    if (!title) return showMessage('❌ Provide role title', true);
    await apiRequest('/roles', 'POST', { title, department_id, min_salary, max_salary, level });
    showMessage('✅ Role created');
    id('roleTitle').value = '';
    id('roleDept').value = '';
    id('roleMinSal').value = '';
    id('roleMaxSal').value = '';
    id('roleLevel').value = '';
    await loadRoles();
  } catch (err) { showMessage('❌ Create role failed: ' + err.message, true); }
};

window.editRole = async (roleId) => {
  const newTitle = prompt('✏️ Enter new role title:');
  if (newTitle === null) return;
  try {
    await apiRequest(`/roles/${roleId}`, 'PUT', { title: newTitle });
    showMessage('✅ Role updated');
    await loadRoles();
  } catch (err) { showMessage('❌ Edit role failed: ' + err.message, true); }
};

window.deleteRole = async (roleId) => {
  if (!confirm('⚠️ Delete this role?')) return;
  try {
    await apiRequest(`/roles/${roleId}`, 'DELETE');
    showMessage('✅ Role deleted');
    await loadRoles();
  } catch (err) { showMessage('❌ Delete role failed: ' + err.message, true); }
};

// ========== LOAD ALL DATA ==========
const loadAll = async () => {
  await Promise.all([loadEmployees(), loadDepartments(), loadRoles()]);
};

// ========== TAB NAVIGATION ==========
document.getElementById('tabAuth').addEventListener('click', () => showSection('auth'));
document.getElementById('tabEmployees').addEventListener('click', () => showSection('employees'));
document.getElementById('tabDepartments').addEventListener('click', () => showSection('departments'));
document.getElementById('tabRoles').addEventListener('click', () => showSection('roles'));

// ========== AUTH BUTTONS ==========
document.getElementById('registerBtn').addEventListener('click', registerAction);
document.getElementById('loginBtn').addEventListener('click', loginAction);
document.getElementById('logoutBtn').addEventListener('click', logoutAction);

// ========== EMPLOYEE BUTTONS ==========
document.getElementById('empRefresh').addEventListener('click', loadEmployees);
document.getElementById('empSearch').addEventListener('input', loadEmployees);
document.getElementById('createEmployeeBtn').addEventListener('click', createEmployee);

// ========== DEPARTMENT BUTTONS ==========
document.getElementById('createDeptBtn').addEventListener('click', createDepartment);

// ========== ROLE BUTTONS ==========
document.getElementById('createRoleBtn').addEventListener('click', createRole);

// ========== INIT ==========
showSection('auth');
updateAuthUI();
if (isLoggedIn()) loadAll();
