<p align="center">
  <img src="./img.png" alt="Smart Exam Room Allocator" width="100%">
</p>

# SEATFORGE🎯

## Basic Details

### Team Name: TinkEra

### Team Members
- Member 1: Nandana G L - SCMS School of Engineering & Technology
- Member 2: Krishnendu S Binu - SCMS School of Engineering & Technology

### Hosted Project Link
https://seatforge.onrender.com/

### Project Description
A Smart Exam Room Allocator is a smart web-based application that automates exam seating arrangements for colleges by efficiently allocating students to classrooms based on their academic year, branch, and special requirements like left-handed seating.

### The Problem Statement
Manual allocation of students to exam halls is time-consuming, error-prone, and often results in inefficient use of classroom capacity. Administrators face challenges in ensuring no mixing of academic years, proper distribution of students across departments, and accommodation of special seating requirements.

### The Solution
Our Smart Exam Room Allocator automates the entire process with an intelligent algorithm that:
- Ensures no mixing of academic years in the same classroom
- Allows multiple departments to share a classroom efficiently
- Caps classroom occupancy at 40 students for proper invigilation
- Automatically calculates left-handed chair requirements based on actual student data
- Generates downloadable PDF reports for easy distribution
- Provides a user-friendly web interface for quick allocation generation

---

## Technical Details

### Technologies/Components Used

**For Software:**
- **Languages used:** Python, JavaScript, HTML, CSS
- **Frameworks used:** Flask (Backend Web Framework)
- **Libraries used:** 
  - jsPDF & jsPDF-AutoTable (PDF generation)
  - CSV parsing libraries (data processing)
- **Tools used:** 
  - VS Code (Development)
  - Git (Version Control)
  - Chrome DevTools (Testing & Debugging)
  - Render (Deployment)

---

## Features

List the key features of your project:
- **Multi-Department Allocation:** Efficiently packs multiple departments into single classrooms (like CS, AI, ECE, ME together)
- **Smart Capacity Management:** Caps each room at 40 students regardless of actual capacity for standardized supervision
- **Auto Left-Handed Tracking:** Automatically counts left-handed students per department without manual input
- **Year Separation:** Strict constraint ensuring different academic years never share the same classroom
- **Professional PDF Export:** Generates university-standard PDF reports with all allocation details
- **Column-Based Seating:** Each department gets dedicated sections within shared classrooms
- **Dynamic CSV Input:** Supports flexible student and classroom data via CSV upload
- **Real-time Validation:** Checks for sufficient classroom capacity before allocation

---

## Implementation

### For Software:

#### Installation
```bash
# Clone the repository
git clone [https://github.com/krixhnndu/Smart-Examroom-Allocator]
cd exam_final_multi

# Install Python dependencies
pip install Flask

# Or use requirements file
pip install -r requirements.txt
```

#### Run
```bash
# Start the Flask server
python app.py

# Server will start on http://localhost:5000
# Open this URL in your web browser
```

---

## Project Documentation

### For Software:

#### Screenshots (Add at least 3)

![Upload Interface](screenshots/upload-screen.png)
*Main upload interface where users can upload students.csv and classrooms.csv files, and select academic years for allocation*

![Allocation Results](screenshots/results-table.png)
*Generated allocation results showing multiple departments per classroom with student counts and left-handed chair requirements*

![PDF Output](screenshots/pdf-output.png)
*Professional PDF report in university-standard format with detailed room-wise allocation and department sections*

#### Diagrams

**System Architecture:**

```
┌─────────────────────────────────────────────────────────┐
│                    Web Browser                          │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │   Upload    │  │    Select    │  │   Download   │    │
│  │  CSV Files  │  │    Years     │  │     PDF      │    │
│  └──────┬──────┘  └──────┬───────┘  └──────▲───────┘    │
│         │                 │                  │          │
│         └─────────────────┼──────────────────┘          │
│                           │                             │
└───────────────────────────┼─────────────────────────────┘
                            │
                    ┌───────▼────────┐
                    │  Flask Server  │
                    │   (Python)     │
                    └───────┬────────┘
                            │
            ┌───────────────┼───────────────┐
            │               │               │
    ┌───────▼──────┐ ┌─────▼─────┐ ┌──────▼──────┐
    │ CSV Parser   │ │ Allocation│ │ PDF Generator│
    │              │ │  Engine   │ │  (jsPDF)     │
    └──────────────┘ └───────────┘ └──────────────┘
```
*System architecture showing client-server interaction, CSV processing, allocation logic, and PDF generation*

**Application Workflow:**

```
User Uploads CSV Files
        ↓
System Validates Format
        ↓
User Selects Year(s)
        ↓
    ┌───────────────────────────┐
    │  Allocation Algorithm     │
    ├───────────────────────────┤
    │ 1. Filter by year         │
    │ 2. Group by department    │
    │ 3. Fill rooms (max 40)    │
    │ 4. Multiple depts/room    │
    │ 5. Count left-handed      │
    │ 6. No year mixing         │
    └───────────┬───────────────┘
                ↓
    Display Results in Table
                ↓
    Generate Professional PDF
                ↓
        User Downloads PDF
```
*Complete workflow from file upload to PDF generation showing the allocation process*

---

## Additional Documentation

### For Web Projects with Backend:

#### API Documentation

**Base URL:** `http://localhost:5000`

##### Endpoints

**GET /**
- **Description:** Serves the main application interface
- **Response:** HTML page with upload interface
- **Status Code:** 200 OK

**POST /allocate**
- **Description:** Processes student and classroom data and generates allocation
- **Content-Type:** `multipart/form-data`
- **Parameters:**
  - `students_csv` (file): CSV file with student data
  - `classrooms_csv` (file): CSV file with classroom data
  - `years[]` (array): Selected academic years (1, 2, 3, or 4)
- **Request Body:**
```
FormData {
  students_csv: File,
  classrooms_csv: File,
  years[]: ["1", "3"]
}
```
- **Success Response (200):**
```json
{
  "success": true,
  "allocation": [
    {
      "room_id": "AD104",
      "branch": "CS",
      "year": "1",
      "first_roll": "CS/2024/1",
      "last_roll": "CS/2024/22",
      "total_students": 22,
      "left_handed_chairs": 2
    },
    {
      "room_id": "AD104",
      "branch": "AI",
      "year": "1",
      "first_roll": "AI/2024/1",
      "last_roll": "AI/2024/18",
      "total_students": 18,
      "left_handed_chairs": 1
    }
  ],
  "total_students": 114,
  "total_allocated": 114,
  "selected_years": ["1"],
  "rooms_used": 3
}
```
- **Error Response (400/500):**
```json
{
  "success": false,
  "error": "Please upload both CSV files"
}
```

---

## Project Demo

### Video
https://drive.google.com/file/d/1jLCdYSP2IXXMez62GFqmyzNi5hTyuhK1/view?usp=sharing

*The video demonstrates:*
- CSV file upload process
- Year selection interface
- Real-time allocation generation
- Multi-department room allocation
- Left-handed student tracking
- Professional PDF export

### Additional Demos
- **Live Demo:** https://seatforge.onrender.com/
- **Sample CSV Files:** Included in repository (`students.csv`, `classrooms.csv`)
- **Sample PDF Output:** Available in project documentation

---


## AI Tools Used (Optional - For Transparency Bonus)

**Tools Used:** Claude AI (Anthropic) & ChatGPT (OpenAI)

**Purpose:** Development assistance, code optimization, and problem-solving

### Claude AI Usage:
**Key Uses:**
- Generated Flask backend boilerplate and routing structure
- Assisted with allocation algorithm logic and optimization
- Created CSV parsing and validation functions
- Helped debug PDF generation integration
- Generated comprehensive documentation and README

**Key Prompts Used:**
- "Create a Flask endpoint to handle CSV file uploads and process allocation"
- "Implement multi-department classroom allocation with 40-student cap"
- "Auto-calculate left-handed students from CSV data without manual input"
- "Generate professional PDF report using jsPDF with table format"

### ChatGPT Usage:
**Key Uses:**
- Initial project ideation and requirement analysis
- Frontend UI/UX design suggestions and layout planning
- JavaScript code snippets for PDF generation
- CSS styling recommendations for responsive design
- Debugging assistance for cross-browser compatibility issues

**Key Prompts Used:**
- "Design a user-friendly interface for exam room allocation system"
- "Create CSS styles for a modern, responsive web application"
- "Help debug jsPDF table generation issues"
- "Suggest best practices for Flask file upload handling"

**Percentage of AI-generated code:** Approximately 65%

**Human Contributions:**
- System architecture design and constraint definition
- Business logic refinement based on real-world requirements
- Integration of all components and modules
- Custom allocation algorithm optimization for edge cases
- Testing with actual college data and scenarios
- UI/UX iterations based on user feedback
- Production deployment and configuration
- Project documentation and presentation

---

## Team Contributions

- **Nandana G L**: Frontend development (HTML/CSS/JS), PDF generation implementation, UI/UX design, testing
- **Krishnendu S Binu**: Backend development (Flask server, allocation algorithm), CSV processing logic
- **Team**: Documentation, system integration, deployment preparation

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

Made with ❤️ at TinkerHub
