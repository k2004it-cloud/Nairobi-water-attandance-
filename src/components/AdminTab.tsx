import { useState, type FormEvent } from 'react';
import {
  Search,
  UserPlus,
  Edit2,
  Trash2,
  X,
  ShieldAlert,
  Save
} from 'lucide-react';
import { Employee, EmployeeStatus } from '../types';
import { DEPARTMENTS } from '../data';

interface AdminTabProps {
  employees: Employee[];
  onAddEmployee: (employee: Employee) => void;
  onEditEmployee: (employee: Employee) => void;
  onDeleteEmployee: (id: string) => void;
}

export default function AdminTab({
  employees,
  onAddEmployee,
  onEditEmployee,
  onDeleteEmployee
}: AdminTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('All Departments');
  const [departments, setDepartments] = useState<string[]>(DEPARTMENTS);
  const [newDepartment, setNewDepartment] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Add/Edit employee modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [editingEmployeeId, setEditingEmployeeId] = useState<string | null>(null);

  // Form states
  const [formName, setFormName] = useState('');
  const [formId, setFormId] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formDept, setFormDept] = useState('Finance');
  const [formPosition, setFormPosition] = useState('');
  const [formImageUrl, setFormImageUrl] = useState('');
  const [formImagePreview, setFormImagePreview] = useState('');
  const [formStatus, setFormStatus] = useState<EmployeeStatus>('Active');
  const [formVerified, setFormVerified] = useState(true);
  const [formError, setFormError] = useState('');

  // Delete confirmation modal state
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  // Stats calculation
  const totalStaff = employees.length;
  const activeStaff = employees.filter((e) => e.status === 'Active').length;
  const onLeaveStaff = employees.filter((e) => e.status === 'On Leave').length;
  const newHires = Math.max(2, Math.round(employees.length * 0.05)); // dynamically calculated or scaled

  // Filter employees
  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch =
      emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept =
      selectedDept === 'All Departments' || emp.department === selectedDept;
    return matchesSearch && matchesDept;
  });

  // Pagination calculation
  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedEmployees = filteredEmployees.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  const openAddModal = () => {
    setModalMode('add');
    setFormName('');
    const existingNumbers = employees
      .map((employee) => Number(employee.id.match(/^NW-(\d+)$/)?.[1]))
      .filter(Number.isFinite);
    const nextNum = Math.max(999, ...existingNumbers) + 1;

    setFormId(`NW-${nextNum}`);
    setFormEmail('');
    setFormDept(departments.length > 1 ? departments[1] : 'All Departments');
    setFormPosition('');
    setFormImageUrl('');
    setFormImagePreview('');
    setFormStatus('Active');
    setFormVerified(true);
    setFormError('');
    setEditingEmployeeId(null);
    setIsModalOpen(true);
  };

  const openEditModal = (emp: Employee) => {
    setModalMode('edit');
    setEditingEmployeeId(emp.id);
    setFormName(emp.name);
    setFormId(emp.id);
    setFormEmail(emp.email);
    setFormDept(emp.department);
    setFormPosition(emp.position);
    setFormImageUrl(emp.imageUrl || '');
    setFormImagePreview(emp.imageUrl || '');
    setFormStatus(emp.status);
    setFormVerified(emp.verified);
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSaveEmployee = (e: FormEvent) => {
    e.preventDefault();

    const trimmedName = formName.trim();
    const trimmedId = formId.trim();
    const trimmedPosition = formPosition.trim();

    if (!trimmedName || !trimmedId || !trimmedPosition) {
      setFormError('Full name, staff ID, and position are required.');
      return;
    }

    const isDuplicateId = modalMode === 'add' && employees.some((employee) => employee.id === trimmedId);
    if (isDuplicateId) {
      setFormError(`Staff ID ${trimmedId} already exists.`);
      return;
    }

    const existingEmployee = editingEmployeeId
      ? employees.find((employee) => employee.id === editingEmployeeId)
      : undefined;
    const emailStr = formEmail.trim() || `${trimmedName.toLowerCase().replace(/\s+/g, '.')}@nairobiwater.co.ke`;

    const payload: Employee = {
      id: trimmedId,
      name: trimmedName,
      email: emailStr,
      department: formDept,
      position: trimmedPosition,
      status: formStatus,
      imageUrl: formImagePreview || existingEmployee?.imageUrl || '',
      verified: formVerified
    };

    if (modalMode === 'add') {
      onAddEmployee(payload);
    } else {
      onEditEmployee(payload);
    }

    setIsModalOpen(false);
  };

  const triggerDelete = (id: string) => {
    setDeleteTargetId(id);
    setIsDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (deleteTargetId) {
      onDeleteEmployee(deleteTargetId);
      setIsDeleteConfirmOpen(false);
      setDeleteTargetId(null);
      // Reset pagination if on empty page
      const updatedFilteredCount = filteredEmployees.length - 1;
      const updatedTotalPages = Math.ceil(updatedFilteredCount / itemsPerPage) || 1;
      if (currentPage > updatedTotalPages) {
        setCurrentPage(updatedTotalPages);
      }
    }
  };

  return (
    <div className="space-y-8 animate-fade-in relative pb-12">
      {/* Upper overview section & Search */}
      <section className="mb-4">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight text-[#003f87] mb-2">
              Employee Management
            </h2>
            <p className="text-[#424752] text-sm font-medium">
              Manage corporate staff records, departments, and status updates.
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            <div className="relative flex-1 min-w-[260px] lg:max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#727784] w-5 h-5" />
              <input
                className="w-full pl-10 pr-4 h-11 bg-white border border-[#c2c6d4] rounded-lg focus:ring-2 focus:ring-[#335f9d] focus:border-[#335f9d] text-sm outline-none transition-all"
                placeholder="Search by name or ID..."
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
            
            <div className="relative">
              <select
                value={selectedDept}
                onChange={(e) => {
                  setSelectedDept(e.target.value);
                  setCurrentPage(1);
                }}
                className="h-11 px-3 pr-8 bg-white border border-[#c2c6d4] rounded-lg text-sm text-[#181c1c] focus:ring-2 focus:ring-[#335f9d] focus:border-[#335f9d] outline-none cursor-pointer"
              >
                {departments.map(dept => (
                  <option key={dept} value={dept}>{dept === 'All Departments' ? 'All Depts' : dept}</option>
                ))}
              </select>
            </div>

            <button
              onClick={openAddModal}
              className="h-11 px-4 bg-[#0056b3] hover:bg-[#003f87] text-white font-semibold text-sm rounded-lg flex items-center gap-1.5 active:scale-95 transition-all shadow-sm cursor-pointer"
            >
              <UserPlus className="w-4.5 h-4.5" />
              Add New
            </button>
          </div>
        </div>
      </section>

      {/* Quick Insights Cards */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-[#e1e4e8] shadow-sm">
          <p className="text-[10px] font-bold text-[#424752] uppercase tracking-wider mb-1">
            Total Staff
          </p>
          <p className="text-2xl font-black text-[#003f87]">{totalStaff}</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-[#e1e4e8] shadow-sm">
          <p className="text-[10px] font-bold text-[#424752] uppercase tracking-wider mb-1">
            Active
          </p>
          <p className="text-2xl font-black text-[#003f87]">{activeStaff}</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-[#e1e4e8] shadow-sm">
          <p className="text-[10px] font-bold text-[#424752] uppercase tracking-wider mb-1">
            On Leave
          </p>
          <p className="text-2xl font-black text-[#722b00]">{onLeaveStaff}</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-[#e1e4e8] shadow-sm">
          <p className="text-[10px] font-bold text-[#424752] uppercase tracking-wider mb-1">
            New Hires
          </p>
          <p className="text-2xl font-black text-[#335f9d]">{newHires}</p>
        </div>
      </section>

      {/* Main Employee Table */}
      <div className="bg-white rounded-xl border border-[#e1e4e8] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-[#f1f4f3] border-b border-[#e1e4e8]">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-[#424752] uppercase tracking-wider">
                  Employee
                </th>
                <th className="px-6 py-4 text-xs font-bold text-[#424752] uppercase tracking-wider">
                  Employee ID
                </th>
                <th className="px-6 py-4 text-xs font-bold text-[#424752] uppercase tracking-wider">
                  Department
                </th>
                <th className="px-6 py-4 text-xs font-bold text-[#424752] uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-xs font-bold text-[#424752] uppercase tracking-wider text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e1e4e8]">
              {paginatedEmployees.length > 0 ? (
                paginatedEmployees.map((emp) => (
                  <tr
                    key={emp.id}
                    className="hover:bg-[#f8fafc] transition-colors duration-150"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {emp.imageUrl ? (
                          <img
                            src={emp.imageUrl}
                            alt={emp.name}
                            className="w-10 h-10 rounded-full object-cover border border-[#c2c6d4]"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-[#f1f4f3] border border-[#c2c6d4] flex items-center justify-center font-bold text-[#003f87]">
                            {emp.name
                              .split(' ')
                              .map((n) => n[0])
                              .join('')
                              .substring(0, 2)
                              .toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-bold text-[#181c1c]">
                            {emp.name}
                          </p>
                          <p className="text-xs text-[#727784]">{emp.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-[#181c1c]">
                      {emp.id}
                    </td>
                    <td className="px-6 py-4">
                      <span className="bg-[#ebeeed] px-3 py-1 rounded-full text-xs font-semibold text-[#424752]">
                        {emp.department}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        emp.status === 'Active'
                          ? 'bg-green-100 text-green-800'
                          : emp.status === 'On Leave'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {emp.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => openEditModal(emp)}
                          className="p-1.5 hover:bg-blue-50 text-[#335f9d] rounded-lg transition-colors cursor-pointer"
                          title="Edit employee record"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => triggerDelete(emp.id)}
                          className="p-1.5 hover:bg-red-50 text-[#ba1a1a] rounded-lg transition-colors cursor-pointer"
                          title="Delete employee record"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    No employees matching the search filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Table Pagination Footer */}
        <div className="px-6 py-4 border-t border-[#e1e4e8] flex justify-between items-center bg-[#f1f4f3]/30">
          <span className="text-xs text-[#424752] font-semibold">
            Showing {Math.min(filteredEmployees.length, startIndex + 1)} to{' '}
            {Math.min(filteredEmployees.length, startIndex + itemsPerPage)} of{' '}
            {filteredEmployees.length} employees
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 border border-[#c2c6d4] rounded hover:bg-[#ebeeed] text-[#181c1c] text-xs transition-colors disabled:opacity-50 disabled:hover:bg-transparent cursor-pointer disabled:cursor-not-allowed"
            >
              Previous
            </button>
            {Array.from({ length: totalPages }).map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentPage(idx + 1)}
                className={`px-3 py-1.5 rounded text-xs font-bold transition-all ${
                  currentPage === idx + 1
                    ? 'bg-[#003f87] text-white'
                    : 'border border-[#c2c6d4] hover:bg-[#ebeeed] text-[#181c1c]'
                }`}
              >
                {idx + 1}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 border border-[#c2c6d4] rounded hover:bg-[#ebeeed] text-[#181c1c] text-xs transition-colors disabled:opacity-50 disabled:hover:bg-transparent cursor-pointer disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Floating Action Button */}
      <button
        onClick={openAddModal}
        className="fixed bottom-24 right-8 w-14 h-14 bg-[#003f87] hover:bg-[#0056b3] text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all z-50 group cursor-pointer"
        title="Add New Employee"
      >
        <UserPlus className="w-6 h-6" />
        <span className="absolute right-full mr-4 bg-[#2d3131] text-white px-3 py-1.5 rounded-lg text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-md">
          Add Employee
        </span>
      </button>

      {/* Slide-out / Modal Dialog for Add & Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg border border-[#e1e4e8] overflow-hidden animate-scale-in">
            <div className="p-1 bg-[#003f87]"></div>
            <div className="px-6 py-4 border-b border-[#e1e4e8] flex items-center justify-between">
              <h3 className="text-xl font-bold text-[#181c1c]">
                {modalMode === 'add' ? 'Add New Employee' : 'Edit Employee Record'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-[#424752]" />
              </button>
            </div>

            <form onSubmit={handleSaveEmployee} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-[#424752] uppercase block mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Omari Kenyatta"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full h-10 px-3 border border-[#c2c6d4] rounded-lg focus:ring-2 focus:ring-[#335f9d] outline-none text-sm text-[#181c1c]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-[#424752] uppercase block mb-1">
                    Staff ID *
                  </label>
                  <input
                    type="text"
                    required
                    disabled={modalMode === 'edit'}
                    placeholder="e.g. NW-1045"
                    value={formId}
                    onChange={(e) => setFormId(e.target.value)}
                    className="w-full h-10 px-3 border border-[#c2c6d4] rounded-lg focus:ring-2 focus:ring-[#335f9d] outline-none text-sm text-[#181c1c] disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#424752] uppercase block mb-1">
                    Position *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Systems Engineer"
                    value={formPosition}
                    onChange={(e) => setFormPosition(e.target.value)}
                    className="w-full h-10 px-3 border border-[#c2c6d4] rounded-lg focus:ring-2 focus:ring-[#335f9d] outline-none text-sm text-[#181c1c]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#424752] uppercase block mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="Leave empty for auto-generated email"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  className="w-full h-10 px-3 border border-[#c2c6d4] rounded-lg focus:ring-2 focus:ring-[#335f9d] outline-none text-sm text-[#181c1c]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#424752] uppercase block mb-1">
                  Passport photo
                </label>
                <div className="flex flex-col gap-2">
                  <label className="cursor-pointer inline-flex items-center justify-center rounded-lg border border-dashed border-[#c2c6d4] bg-slate-50 px-4 py-3 text-sm font-medium text-[#424752] hover:border-[#335f9d] hover:text-[#003f87] transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) {
                          setFormImageUrl('');
                          setFormImagePreview('');
                          return;
                        }
                        const reader = new FileReader();
                        reader.onload = () => {
                          const dataUrl = reader.result as string;
                          setFormImageUrl(dataUrl);
                          setFormImagePreview(dataUrl);
                        };
                        reader.readAsDataURL(file);
                      }}
                    />
                    {formImagePreview ? 'Change photo' : 'Upload passport photo'}
                  </label>

                  {formImagePreview && (
                    <div className="flex items-center gap-3">
                      <img
                        src={formImagePreview}
                        alt="Passport preview"
                        className="h-20 w-20 rounded-lg object-cover border border-[#c2c6d4]"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setFormImageUrl('');
                          setFormImagePreview('');
                        }}
                        className="rounded-lg border border-[#c2c6d4] px-3 py-2 text-sm text-[#424752] hover:bg-gray-100"
                      >
                        Remove photo
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-[#424752] uppercase block mb-1">
                    Department
                  </label>
                  <select
                    value={formDept}
                    onChange={(e) => setFormDept(e.target.value)}
                    className="w-full h-10 px-2 border border-[#c2c6d4] rounded-lg focus:ring-2 focus:ring-[#335f9d] outline-none text-sm text-[#181c1c] cursor-pointer"
                  >
                    {DEPARTMENTS.filter(d => d !== 'All Departments').map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-[#424752] uppercase block mb-1">
                    Status
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as EmployeeStatus)}
                    className="w-full h-10 px-2 border border-[#c2c6d4] rounded-lg focus:ring-2 focus:ring-[#335f9d] outline-none text-sm text-[#181c1c] cursor-pointer"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="On Leave">On Leave</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="verified"
                  checked={formVerified}
                  onChange={(e) => setFormVerified(e.target.checked)}
                  className="w-4 h-4 text-[#003f87] border-[#c2c6d4] rounded focus:ring-[#003f87]"
                />
                <label htmlFor="verified" className="text-xs font-bold text-[#424752] uppercase cursor-pointer selection:bg-transparent">
                  Verified security clearance (Shield badge)
                </label>
              </div>

              {formError && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-[#ba1a1a]">
                  {formError}
                </p>
              )}

              <div className="pt-4 border-t border-[#e1e4e8] flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-[#c2c6d4] rounded-lg text-sm font-semibold text-[#424752] hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#0056b3] hover:bg-[#003f87] text-white font-semibold text-sm rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Save className="w-4.5 h-4.5" />
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteConfirmOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md border border-red-200 overflow-hidden animate-scale-in">
            <div className="p-1 bg-[#ba1a1a]"></div>
            <div className="p-6">
              <div className="flex items-center gap-3 text-[#ba1a1a] mb-4">
                <ShieldAlert className="w-8 h-8 shrink-0" />
                <h3 className="text-lg font-bold">Delete Employee Record?</h3>
              </div>
              <p className="text-sm text-[#424752] leading-relaxed">
                Are you absolutely sure you want to remove this employee record from the Nairobi Water system? This action is permanent and cannot be undone.
              </p>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setIsDeleteConfirmOpen(false)}
                  className="px-4 py-2 border border-[#c2c6d4] rounded-lg text-sm font-semibold text-[#424752] hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-5 py-2 bg-[#ba1a1a] hover:bg-red-800 text-white font-semibold text-sm rounded-lg transition-colors cursor-pointer"
                >
                  Delete Permanently
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
