# Student Management System

A responsive React student directory for administrators. It demonstrates React event handling through controlled form inputs, dynamic lists, debounced search, deletion, student detail views, form validation, keyboard shortcuts, event bubbling, and throttled submissions.

## Run locally

Requirements: Node.js 18 or newer.

```bash
npm install
npm run dev
```

Open the local URL printed by Vite. Create a production build with `npm run build`.

## Features

- Register students with controlled inputs and validation for name, email, course, and year. Duplicate email addresses are rejected.
- View and search student records by name, email, course, year, or student ID. Search is debounced by 300 ms.
- Open a student's profile by selecting their row; the selected student is passed into the details view.
- Delete a record with `filter()`. The delete button stops event propagation so it does not also open the profile.
- Use `/` to focus the search box and `Escape` to dismiss the student details modal. These shortcuts are implemented in a custom hook.
- Registration is throttled to prevent repeated submissions in a short interval.
- Student records persist in the browser's local storage. The initial directory contains demo records.

This is a front-end demonstration. It does not include authentication, a server, or shared multi-user storage; records are local to the browser and device.
