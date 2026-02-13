from flask import Flask, render_template, request, jsonify
import csv
from io import StringIO
from datetime import datetime

app = Flask(__name__)

def parse_csv(file_content):
    csv_file = StringIO(file_content)
    reader = csv.DictReader(csv_file)

    # 🔥 CLEAN HEADER KEYS (fix RoomID error)
    reader.fieldnames = [h.strip().replace('\ufeff', '') for h in reader.fieldnames]

    rows = []
    for row in reader:
        clean_row = {k.strip().replace('\ufeff', ''): v for k, v in row.items()}
        rows.append(clean_row)

    return rows


def allocate_students_updated(students, classrooms, selected_years):
    """
    Updated allocation with multi-department per classroom:
    1. Max 40 students per classroom (even if capacity > 40)
    2. No mixing of academic years in same classroom
    3. Multiple departments can share a classroom
    4. Each department gets their own column/section
    5. Fill classroom completely (up to 40) before moving to next
    6. Auto-calculate left-handed chairs from actual students
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
        
        # Create a pool of remaining students per branch
        remaining_by_branch = {branch: list(students_by_branch[branch]) for branch in sorted_branches}
        
        # Fill classrooms with multiple departments
        while any(len(remaining_by_branch[b]) > 0 for b in remaining_by_branch):
            if classroom_idx >= len(classrooms):
                # Out of classrooms
                return {
                    'success': False,
                    'error': f'Not enough classrooms! Need more rooms for Year {year}'
                }
            
            classroom = classrooms[classroom_idx]
            room_id = classroom['RoomID']
            room_capacity = min(int(classroom['Capacity']), 40)  # Cap at 40
            
            # Track what goes in this room
            room_allocations = []  # List of {branch, first_roll, last_roll, count, left_handed}
            room_total = 0
            
            # Fill this room with students from different departments
            for branch in sorted_branches:
                if room_total >= room_capacity:
                    break  # Room is full
                
                if len(remaining_by_branch[branch]) == 0:
                    continue  # No more students from this branch
                
                # How many students can we fit from this branch?
                available_space = room_capacity - room_total
                students_to_allocate = []
                
                # Take students from this branch (up to available space)
                while len(remaining_by_branch[branch]) > 0 and len(students_to_allocate) < available_space:
                    students_to_allocate.append(remaining_by_branch[branch].pop(0))
                
                if len(students_to_allocate) > 0:
                    # Count left-handed students in this group
                    left_handed_count = sum(1 for s in students_to_allocate if s.get('HandType', 'R') == 'L')
                    
                    # Add to room allocation
                    room_allocations.append({
                        'branch': branch,
                        'first_roll': students_to_allocate[0]['RollNumber'],
                        'last_roll': students_to_allocate[-1]['RollNumber'],
                        'count': len(students_to_allocate),
                        'left_handed': left_handed_count
                    })
                    
                    room_total += len(students_to_allocate)
                    total_allocated += len(students_to_allocate)
            
            # Create allocation entries for this room (one per department)
            for alloc in room_allocations:
                allocation.append({
                    'room_id': room_id,
                    'branch': alloc['branch'],
                    'year': year,
                    'first_roll': alloc['first_roll'],
                    'last_roll': alloc['last_roll'],
                    'total_students': alloc['count'],
                    'left_handed_chairs': alloc['left_handed'] if alloc['left_handed'] > 0 else None
                })
            
            classroom_idx += 1
    
    return {
        'success': True,
        'allocation': allocation,
        'total_students': total_students,
        'total_allocated': total_allocated,
        'selected_years': selected_years,
        'rooms_used': classroom_idx
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
