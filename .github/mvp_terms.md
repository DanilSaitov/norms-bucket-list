
## Project Overview

Norm's Bucketlist is a web application designed for UNC Charlotte students. The application provides a list of campus traditions and experiences students are encouraged to complete before graduation.

Students submit photo proof of completed traditions, and university staff verify submissions. The goal is to promote school pride, student engagement, and preservation of campus traditions.

## MVP Vision

The minimum viable product must support the full submission and verification workflow.

### Students must be able to:
- Create accounts and log in
- View bucket list challenges
- Upload image proof of challenge completion
- Track completion progress
- View approval or rejection status

### Staff must be able to:
- Log in securely
- View submitted challenges
- Approve or reject submissions
- Provide feedback for rejected submissions

## Technology Stack

### Frontend:
- React (JavaScript)
- HTML/CSS
- Axios for API calls

### Backend:
- Node.js
- Express.js

### Database:
- PostgreSQL
- Prisma ORM

### Testing:
- Jest
- Supertest

### Deployment:
- Render hosting
- Cloudinary for image storage

## Architecture Goals
- Clean separation between frontend and backend
- REST API based communication
- Role based access control
- Modular backend route structure
- Scalable database design
- Maintainable code structure

## Coding Preferences
- Use modern JavaScript (ES6+)
- Use async/await instead of promise chaining
- Use REST naming conventions
- Keep controllers, routes, and services separated
- Write reusable and readable functions
- Include basic error handling in all endpoints
- Prefer clarity over cleverness

## Database Design Expectations

### Entities expected:
- Users
- Challenges
- Submissions

### Relationships:
- Users can submit multiple challenges
- Challenges can have multiple submissions
- Submissions belong to one user and one challenge

## Security Expectations
- Passwords must be hashed
- Role validation required for staff actions
- Input validation required for all endpoints

## Development Priorities
1. Authentication system
2. Challenge retrieval
3. Submission upload
4. Staff approval workflow
5. Progress tracking

Avoid adding non essential features until core workflow is complete.
