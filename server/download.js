const axios = require('axios');
const fs = require('fs');
const path = require('path');

const API_KEY = '238be5d9a7msh1cac12e545abbfdp13059cjsne980a6948e11'; 
const HOST = 'exercisedb.p.rapidapi.com';

const downloadData = async () => {
    console.log(">> STARTING SMART DOWNLOAD: Fetching every single exercise...");
    
    let allExercises = [];
    let offset = 0;
    const requestLimit = 50; // We ask for 50
    let fetchMore = true;

    try {
        while (fetchMore) {
            
            const options = {
                method: 'GET',
                url: 'https://exercisedb.p.rapidapi.com/exercises',
                params: { 
                    limit: requestLimit.toString(), 
                    offset: offset.toString() 
                }, 
                headers: {
                    'x-rapidapi-key': API_KEY,
                    'x-rapidapi-host': HOST
                }
            };

            const response = await axios.request(options);
            const data = response.data;

            if (data && Array.isArray(data) && data.length > 0) {
                
                // 1. Add new items to our list
                allExercises = [...allExercises, ...data];
                
                console.log(`   + Offset ${offset}: Received ${data.length} items. Total Stored: ${allExercises.length}`);
                
                // 2. CRITICAL FIX: Increment offset by what we RECEIVED, not what we asked for.
                offset += data.length;

                // Rate Limit Safety (Optional: slight pause to be nice to the API)
                // await new Promise(r => setTimeout(r, 200));

            } else {
                // 3. Stop only when we receive 0 items
                console.log("   >> API returned 0 items. Download Complete.");
                fetchMore = false;
            }
        }
        
        console.log(`>> SUCCESS: Downloaded TOTAL ${allExercises.length} exercises.`);

        // Ensure directory exists
        const dir = path.join(__dirname, 'data');
        if (!fs.existsSync(dir)){
            fs.mkdirSync(dir);
        }

        // Save to JSON file
        const filePath = path.join(__dirname, 'data', 'exercises.json');
        fs.writeFileSync(filePath, JSON.stringify(allExercises, null, 2));
        
        console.log(`>> DATABASE SAVED: ${filePath}`);

    } catch (error) {
        console.error(">> DOWNLOAD ERROR:", error.message);
        if (error.response) console.error("API Status:", error.response.status);
    }
};

downloadData();