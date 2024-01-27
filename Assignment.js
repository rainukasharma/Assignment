const XLSX = require('xlsx'); // library for handling Excel files

// Loading the workbook from the file
const workbook = XLSX.readFile('./Assignment_Timecard.xlsx' ,  { cellDates: true });
const sheet = workbook.Sheets['Sheet1'];

// Converting the sheet data to JSON
const data = XLSX.utils.sheet_to_json(sheet);

  // Helper function to group data by employee name and position ID
  const groupDataByEmployee = () => {
    const groupedData = {};
  
    for (const entry of data) {
      const key = `${entry['Employee Name']}_${entry['Position ID']}`;
  
      if (!groupedData[key]) {          
        groupedData[key] = [];
      }
  
      groupedData[key].push(entry);
    }
  
    return groupedData;
  };
  

// Helper function to compare dates without time
const compareDatesWithoutTime = (date1, date2) => {
    const dayDifference = moment(date1).startOf('day').diff(moment(date2).startOf('day'), 'days');
    return Math.abs(dayDifference) === 1;
};

const findEmployeesWith7ConsecutiveDays = () => {
    const employeesWith7ConsecutiveDays = {};

    // Group data by employee name and position ID
    const groupedData = groupDataByEmployee();

    // Iterate through each employee group
    for (const employeeGroup of Object.values(groupedData)) {
        // Sort entries within the employee group by date and time
        const sortedEntries = employeeGroup.sort((a, b) => moment(a['Time']).diff(moment(b['Time'])));

        let consecutiveDays = 1;

        // Iterate through entries and check for consecutive days
        for (let i = 1; i < sortedEntries.length; i++) {
            
            if ((sortedEntries[i]['Time']) && sortedEntries[i - 1]['Time']) {  //edge case handling only access if they exist
              
                const currentDate = moment(sortedEntries[i]['Time']);
                const previousDate = moment(sortedEntries[i - 1]['Time']);

               // Check if the employee is present on the next consecutive day
                 if (
                   compareDatesWithoutTime(currentDate, previousDate) &&
                   sortedEntries[i]['Employee Name'] === sortedEntries[i - 1]['Employee Name'] &&
                   sortedEntries[i]['Position ID'] === sortedEntries[i - 1]['Position ID']
               ) {
                consecutiveDays++;

                // If 7 consecutive days are found, add the details to the result object
                if (consecutiveDays === 7) {
                    const key = `${sortedEntries[i]['Employee Name']}_${sortedEntries[i]['Position ID']}`;
                    if (!employeesWith7ConsecutiveDays[key]) {
                        employeesWith7ConsecutiveDays[key] = {
                            Name: sortedEntries[i]['Employee Name'],
                            Position: sortedEntries[i]['Position ID'],
                        };
                    }
                }
            } else {
             
                consecutiveDays = 1; // Reset consecutiveDays if not consecutive
            }
          }
        }
    }

    return Object.values(employeesWith7ConsecutiveDays);
};



    // Function to check employees with less than 10 hours between shifts but greater than 1 hour
  const moment = require('moment');
  const findEmployeesWithShortBreaks = () => {
    const employeesWithShortBreaks = {};
  
    // Group data by employee name and position ID
    const groupedData = groupDataByEmployee();
  
    // Iterate through each employee group
    for (const employeeGroup of Object.values(groupedData)) {
      // Iterate through entries and check for short breaks
      for (let i = 1; i < employeeGroup.length; i++) {
        const currentEntry = employeeGroup[i];
        const previousEntry = employeeGroup[i - 1];
       
        // Checking if 'Time Out' is defined in previousEntry before attempting to convert  (considering edge case if the data is missing)
        if (previousEntry && previousEntry['Time Out'] && currentEntry && currentEntry['Time']){

            const startTime = moment(previousEntry['Time Out'], "MM/DD/YYYY hh:mm A");
            const endTime = moment(currentEntry['Time'], "MM/DD/YYYY hh:mm A");
            
        // Calculate the time difference in milliseconds
        const timeDifference = endTime - startTime;
        
        // Convert milliseconds to hours
        const timeDifferenceInHours = timeDifference / (1000 * 60 * 60);
        
  
        // Check if the time difference is less than 10 hours but greater than 1 hour
        if (timeDifferenceInHours > 1 && timeDifferenceInHours < 10) {
          
            const key = `${currentEntry['Employee Name']}_${currentEntry['Position ID']}`;
          
            if (!employeesWithShortBreaks[key]) {
            employeesWithShortBreaks[key] = {
              name: currentEntry['Employee Name'],
              position: currentEntry['Position ID'],
            };
          }
        }
      }
     }
    }
  
    return Object.values(employeesWithShortBreaks);
  };
  
  // Function to check employees who have worked for more than 14 hours in a single shift


  // Helper function to convert time in HH:mm format to hours
  const timeToHours = (timeString) => {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours + minutes / 60;
  };


const findEmployeesWithLongShifts = () => {
    const employeesWithLongShifts = [];
  
    // Group data by employee name and position ID
    const groupedData = groupDataByEmployee(data);
  
    // Iterate through each employee group
    for (const employeeGroup of Object.values(groupedData)) {
      // Iterate through entries and check for long shifts
      for (const entry of employeeGroup) {
        // Calculate the duration of the shift in hours
        const shiftDurationInHours = entry['Timecard Hours (as Time)']
          ? timeToHours(entry['Timecard Hours (as Time)'])
          : 0;           //edge case if the value doesnt exist set it as 0
  
        // Check if the duration is more than 14 hours
        if (shiftDurationInHours > 14) {
          employeesWithLongShifts.push({
            Name: entry['Employee Name'],
            Position: entry['Position ID'],
            ShiftStart: entry['Time'],
            ShiftEnd: entry['Time Out'],
            ShiftDuration_in_hours: shiftDurationInHours.toFixed(2),
          });
        }
      }
    }
  
    return employeesWithLongShifts;
  };

// Printing the results
console.log("Employees who worked 7 consecutive days:");
console.log(findEmployeesWith7ConsecutiveDays());

console.log("Employees with short breaks (1 to 10 hours):");
console.log(findEmployeesWithShortBreaks());

console.log("Employees with long shifts (more than 14 hours):");
console.log(findEmployeesWithLongShifts());
