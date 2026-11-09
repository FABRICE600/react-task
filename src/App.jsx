import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  BookOpen,
  Check,
  ChevronDown,
  GraduationCap,
  Mail,
  Plus,
  Search,
  Trash2,
  UserRound,
  UsersRound,
  X,
} from 'lucide-react';

const STORAGE_KEY = 'student-management-records';
const INITIAL_STUDENTS = [
  { id: 'STU-2401', name: 'Aline Uwase', email: 'aline.uwase@example.com', course: 'Computer Science', year: 'Year 2' },
  { id: 'STU-2402', name: 'David Niyonzima', email: 'david.niyonzima@example.com', course: 'Information Technology', year: 'Year 1' },
  { id: 'STU-2403', name: 'Grace Mukamana', email: 'grace.mukamana@example.com', course: 'Software Engineering', year: 'Year 3' },
  { id: 'STU-2404', name: 'Eric Habimana', email: 'eric.habimana@example.com', course: 'Computer Science', year: 'Year 4' },
];

function getInitialStudents() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : INITIAL_STUDENTS;
  } catch {
    return INITIAL_STUDENTS;
  }
}

function useDebouncedValue(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedValue(value), delay);
    return () => window.clearTimeout(timeout);
  }, [value, delay]);
  return debouncedValue;
}

// Runs immediately once, then ignores repeated calls until the wait period ends.
function useThrottledCallback(callback, wait = 800) {
  const callbackRef = useRef(callback);
  const lastRunRef = useRef(0);
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  return useCallback((...args) => {
    const now = Date.now();
    if (now - lastRunRef.current < wait) return false;
    lastRunRef.current = now;
    callbackRef.current(...args);
    return true;
  }, [wait]);
}

function useKeyboardShortcuts({ onFocusSearch, onClose }) {
  const handlersRef = useRef({ onFocusSearch, onClose });
  useEffect(() => {
    handlersRef.current = { onFocusSearch, onClose };
  }, [onFocusSearch, onClose]);

  useEffect(() => {
    function handleKeyDown(event) {
      const target = event.target;
      const isTyping = target instanceof HTMLElement && (
        target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)
      );
      if (event.key === 'Escape') {
        handlersRef.current.onClose();
        return;
      }
      if (event.key === '/' && !isTyping && !event.metaKey && !event.ctrlKey && !event.altKey) {
        event.preventDefault();
        handlersRef.current.onFocusSearch();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
}

function makeStudentId() {
  return `STU-${Math.floor(1000 + Math.random() * 9000)}`;
}

function validateStudent(values, students) {
  const errors = {};
  if (!values.name.trim()) errors.name = 'Enter the student’s full name.';
  if (!values.email.trim()) {
    errors.email = 'Enter an email address.';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
    errors.email = 'Enter a valid email address.';
  } else if (students.some((student) => student.email.toLowerCase() === values.email.trim().toLowerCase())) {
    errors.email = 'A student with this email is already registered.';
  }
  if (!values.course) errors.course = 'Choose a course.';
  if (!values.year) errors.year = 'Choose a year of study.';
  return errors;
}

const emptyForm = { name: '', email: '', course: '', year: '' };

export default function App() {
  const [students, setStudents] = useState(getInitialStudents);
  const [query, setQuery] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [notice, setNotice] = useState('');
  const searchRef = useRef(null);
  const debouncedQuery = useDebouncedValue(query, 300);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(students));
    } catch {
      setNotice('Could not save changes in this browser.');
    }
  }, [students]);

  useEffect(() => {
    if (!notice) return undefined;
    const timer = window.setTimeout(() => setNotice(''), 3200);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const focusSearch = useCallback(() => searchRef.current?.focus(), []);
  const closeDetails = useCallback(() => setSelectedStudent(null), []);
  useKeyboardShortcuts({ onFocusSearch: focusSearch, onClose: closeDetails });

  const filteredStudents = useMemo(() => {
    const normalizedQuery = debouncedQuery.trim().toLowerCase();
    if (!normalizedQuery) return students;
    return students.filter((student) =>
      [student.name, student.email, student.course, student.year, student.id]
        .some((value) => value.toLowerCase().includes(normalizedQuery)),
    );
  }, [students, debouncedQuery]);

  const handleFieldChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: '' }));
  };

  const registerStudent = useThrottledCallback((event) => {
    event.preventDefault();
    const nextErrors = validateStudent(form, students);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    const student = {
      ...form,
      id: makeStudentId(),
      name: form.name.trim(),
      email: form.email.trim(),
    };
    setStudents((current) => [student, ...current]);
    setForm(emptyForm);
    setErrors({});
    setNotice(`${student.name} was registered successfully.`);
  }, 700);

  const handleSubmit = (event) => {
    if (!registerStudent(event)) {
      event.preventDefault();
      setNotice('Please wait a moment before registering another student.');
    }
  };

  const deleteStudent = (studentId) => {
    const student = students.find((item) => item.id === studentId);
    setStudents((current) => current.filter((item) => item.id !== studentId));
    if (selectedStudent?.id === studentId) setSelectedStudent(null);
    if (student) setNotice(`${student.name} was removed from the records.`);
  };

  const totalCourses = new Set(students.map((student) => student.course)).size;

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#home" aria-label="Campus home">
          <span className="brand-mark"><GraduationCap size={22} strokeWidth={2.2} /></span>
          <span>campus<span className="brand-dot">.</span></span>
        </a>
        <div className="side-label">Workspace</div>
        <a className="nav-item active" href="#students"><UsersRound size={18} /> Students</a>
        <div className="sidebar-note">
          <div className="note-icon"><BookOpen size={17} /></div>
          <strong>Keep records up to date</strong>
          <p>Register students and manage their academic details in one place.</p>
        </div>
        <div className="sidebar-footer"><span className="status-dot" /> All changes saved locally</div>
      </aside>

      <section className="main-content" id="home">
        <header className="topbar">
          <div className="breadcrumb">Workspace <span>/</span> <strong>Students</strong></div>
          <div className="admin-profile">
            <div className="admin-avatar">A</div>
            <div><strong>Administrator</strong><span>School admin</span></div>
            <ChevronDown size={16} className="muted-icon" />
          </div>
        </header>

        <div className="page-content" id="students">
          <div className="page-heading">
            <div>
              <div className="eyebrow">STUDENT DIRECTORY</div>
              <h1>Students</h1>
              <p className="page-subtitle">Manage student records and keep your campus organized.</p>
            </div>
            <a className="primary-button heading-button" href="#register"><Plus size={18} /> Add student</a>
          </div>

          <section className="stats-grid" aria-label="Student statistics">
            <div className="stat-card"><span className="stat-icon indigo"><UsersRound size={18} /></span><span className="stat-label">Total students</span><strong>{students.length}</strong><small>Registered records</small></div>
            <div className="stat-card"><span className="stat-icon mint"><BookOpen size={18} /></span><span className="stat-label">Courses</span><strong>{totalCourses}</strong><small>Courses represented</small></div>
            <div className="stat-card"><span className="stat-icon peach"><GraduationCap size={19} /></span><span className="stat-label">Showing</span><strong>{filteredStudents.length}</strong><small>{debouncedQuery ? 'Matching students' : 'Visible in directory'}</small></div>
          </section>

          <section className="directory-card" aria-labelledby="directory-title">
            <div className="card-heading">
              <div><h2 id="directory-title">Student directory</h2><p>Click a student to view their details.</p></div>
              <label className="search-box">
                <Search size={17} />
                <input ref={searchRef} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search students..." aria-label="Search students" />
                <kbd>/</kbd>
              </label>
            </div>
            <div className="student-table-wrap">
              <table className="student-table">
                <thead><tr><th>Student</th><th>Student ID</th><th>Course</th><th>Year</th><th><span className="sr-only">Actions</span></th></tr></thead>
                <tbody>
                  {filteredStudents.map((student) => (
                    <tr key={student.id} className="student-row" onClick={() => setSelectedStudent(student)} tabIndex={0} onKeyDown={(event) => { if (event.key === 'Enter') setSelectedStudent(student); }} aria-label={`View ${student.name}'s details`}>
                      <td><div className="student-identity"><span className={`student-avatar avatar-${student.name.charCodeAt(0) % 5}`}>{student.name.split(/\s+/).map((part) => part[0]).slice(0, 2).join('').toUpperCase()}</span><span><strong>{student.name}</strong><small>{student.email}</small></span></div></td>
                      <td><span className="id-pill">{student.id}</span></td>
                      <td><span className="course-cell">{student.course}</span></td>
                      <td><span className="year-pill">{student.year}</span></td>
                      <td className="action-cell"><button className="icon-button delete-button" type="button" title={`Delete ${student.name}`} aria-label={`Delete ${student.name}`} onClick={(event) => { event.stopPropagation(); deleteStudent(student.id); }}><Trash2 size={16} /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredStudents.length === 0 && <div className="empty-state"><span className="empty-icon"><Search size={20} /></span><strong>No students found</strong><p>{students.length ? 'Try another name, email, course, or student ID.' : 'Register a student to get started.'}</p></div>}
            </div>
            <div className="table-footer"><span>Showing <strong>{filteredStudents.length}</strong> of <strong>{students.length}</strong> students</span><span>Search updates as you type</span></div>
          </section>

          <section className="registration-card" id="register" aria-labelledby="registration-title">
            <div className="registration-intro">
              <span className="registration-icon"><UserRound size={20} /></span>
              <div><h2 id="registration-title">Register a student</h2><p>Add a new student to your directory.</p></div>
            </div>
            <form className="student-form" onSubmit={handleSubmit} noValidate>
              <div className="form-grid">
                <label className="field"><span>Full name</span><input name="name" value={form.name} onChange={handleFieldChange} placeholder="e.g. Alex Johnson" aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? 'name-error' : undefined} />{errors.name && <small className="field-error" id="name-error">{errors.name}</small>}</label>
                <label className="field"><span>Email address</span><div className="input-with-icon"><Mail size={16} /><input name="email" type="email" value={form.email} onChange={handleFieldChange} placeholder="alex@university.edu" aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? 'email-error' : undefined} /></div>{errors.email && <small className="field-error" id="email-error">{errors.email}</small>}</label>
                <label className="field"><span>Course</span><select name="course" value={form.course} onChange={handleFieldChange} aria-invalid={Boolean(errors.course)}><option value="">Select a course</option><option>Computer Science</option><option>Information Technology</option><option>Software Engineering</option><option>Business Administration</option><option>Data Science</option><option>Other</option></select>{errors.course && <small className="field-error">{errors.course}</small>}</label>
                <label className="field"><span>Year of study</span><select name="year" value={form.year} onChange={handleFieldChange} aria-invalid={Boolean(errors.year)}><option value="">Select year</option><option>Year 1</option><option>Year 2</option><option>Year 3</option><option>Year 4</option><option>Year 5</option></select>{errors.year && <small className="field-error">{errors.year}</small>}</label>
              </div>
              <div className="form-bottom"><span><Check size={15} /> Required fields must be completed</span><button className="primary-button" type="submit"><Plus size={17} /> Register student</button></div>
            </form>
          </section>
          <footer className="page-footer">Student records are stored in this browser on this device.</footer>
        </div>
      </section>

      {notice && <div className="toast" role="status"><span className="toast-check"><Check size={15} /></span>{notice}<button type="button" aria-label="Dismiss notification" onClick={() => setNotice('')}><X size={15} /></button></div>}

      {selectedStudent && <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) closeDetails(); }}>
        <section className="details-modal" role="dialog" aria-modal="true" aria-labelledby="details-title">
          <button type="button" className="modal-close icon-button" aria-label="Close student details" onClick={closeDetails}><X size={19} /></button>
          <span className={`details-avatar avatar-${selectedStudent.name.charCodeAt(0) % 5}`}>{selectedStudent.name.split(/\s+/).map((part) => part[0]).slice(0, 2).join('').toUpperCase()}</span>
          <div className="eyebrow">STUDENT PROFILE</div><h2 id="details-title">{selectedStudent.name}</h2><p className="details-email">{selectedStudent.email}</p>
          <div className="details-list"><div><span>Student ID</span><strong>{selectedStudent.id}</strong></div><div><span>Course</span><strong>{selectedStudent.course}</strong></div><div><span>Year of study</span><strong>{selectedStudent.year}</strong></div></div>
          <button type="button" className="secondary-button" onClick={closeDetails}>Close details</button>
        </section>
      </div>}
    </main>
  );
}
