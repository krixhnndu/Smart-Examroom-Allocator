from flask import Flask, render_template, request, jsonify
import csv
from io import StringIO
from datetime import datetime

app = Flask(__name__)

def parse_csv(file_content):
    """Parse CSV file content and return list of dictionaries"""
    csv_file = StringIO(file_content)
    reader = csv.DictReader(csv_file)
    return list(reader)

def allocate_students_updated(students, classrooms, selected_years):
    """
    Updated allocation with new constraints:
    1. Max 40 students per classroom (even if capacity > 40)
    2. No mixing of academic years in same classroom
    3. Left-handed seating allocation - AUTO-CALCULATED from students
    4. Full classroom utilization (fill to 40 before next room)
    5. Year-wise sequential allocation
    """
    
    # Filter students by selected years
    filtered_students = [s for s in students if s['Year'] in selected_years]
    
    # Calculate total students
    total_students = len(filtered_students)
    
    # Group students by year, then by branch
    students_by_year = {}
    for student in filtered_students:
        year = student['Year']
        if year not in students_by_year:
            students_by_year[year] = []
        students_by_year[year].append(student)
    
    # Sort years to process in order
    sorted_years = sorted(students_by_year.keys())
    
    # Allocation result
    allocation = []
    classroom_idx = 0
    total_allocated = 0
    
    # Process each year separately (no mixing)
    for year in sorted_years:
        year_students = students_by_year[year]
        
        # Group by branch within this year
        students_by_branch = {}
        for student in year_students:
            branch = student['Branch']
            if branch not in students_by_branch:
                students_by_branch[branch] = []
            students_by_branch[branch].append(student)
        
        # Sort branches alphabetically for consistent allocation
        sorted_branches = sorted(students_by_branch.keys())
        
        # Allocate branches for this year
        for branch in sorted_branches:
            branch_students = students_by_branch[branch]
            
            # Process this branch
            remaining_students = list(branch_students)
            
            while len(remaining_students) > 0:
                if classroom_idx >= len(classrooms):
                    # Out of classrooms
                    return {
                        'success': False,
                        'error': f'Not enough classrooms! Need more rooms for Year {year}, Branch {branch}'
                    }
                
                classroom = classrooms[classroom_idx]
                room_id = classroom['RoomID']
                room_capacity = min(int(classroom['Capacity']), 40)  # Cap at 40
                
                # Allocate students to this room (up to capacity)
                room_students = []
                while len(remaining_students) > 0 and len(room_students) < room_capacity:
                    room_students.append(remaining_students.pop(0))
                
                # COUNT left-handed students in THIS room
                left_handed_count = sum(1 for s in room_students if s.get('HandType', 'R') == 'L')
                
                # Create allocation entry
                if len(room_students) > 0:
                    # Get roll number range
                    first_roll = room_students[0]['RollNumber']
                    last_roll = room_students[-1]['RollNumber']
                    
                    allocation.append({
                        'room_id': room_id,
                        'branch': branch,
                        'year': year,
                        'first_roll': first_roll,
                        'last_roll': last_roll,
                        'total_students': len(room_students),
                        'left_handed_chairs': left_handed_count if left_handed_count > 0 else None
                    })
                    
                    total_allocated += len(room_students)
                    classroom_idx += 1
    
    return {
        'success': True,
        'allocation': allocation,
        'total_students': total_students,
        'total_allocated': total_allocated,
        'selected_years': selected_years,
        'rooms_used': len(allocation)
    }

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/allocate', methods=['POST'])
def allocate():
    try:
        # Get uploaded files
        students_file = request.files.get('students_csv')
        classrooms_file = request.files.get('classrooms_csv')
        selected_years = request.form.getlist('years[]')
        
        if not students_file or not classrooms_file:
            return jsonify({'success': False, 'error': 'Please upload both CSV files'})
        
        if not selected_years:
            return jsonify({'success': False, 'error': 'Please select at least one academic year'})
        
        # Read and parse CSV files
        students_content = students_file.read().decode('utf-8')
        classrooms_content = classrooms_file.read().decode('utf-8')
        
        students = parse_csv(students_content)
        classrooms = parse_csv(classrooms_content)
        
        # Perform allocation with updated logic
        result = allocate_students_updated(students, classrooms, selected_years)
        
        return jsonify(result)
    
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
