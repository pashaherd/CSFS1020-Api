require('dotenv').config();
const express = require('express'); 
const app = express()
const cors = require('cors'); 
const jwt = require('jsonwebtoken'); 
const fs = require('fs'); 
const { v4: uuidv4} = require('uuid'); 
const verifyJWTMiddleware = require('./verify')

const port = process.env.PORT
const secret = process.env.JWT_SECRET

app.set('view engine', 'ejs'); 

app.use(cors());
app.use(express.json()); 


// Initialize JWT
app.get('/', (req,res) =>{
    const token = uuidv4(); 
     
    jwt.sign({token},secret,(err,token) =>{
        if(err){
            res.status(500).json({ok:false,status:"failed to create token"})
          return
        }
        console.log(`Bearer ${token}`)
        res.status(200).json({ok:true, status:`token created: ${token}`})
    })

})

// Get All Data
app.get('/api/data',verifyJWTMiddleware,(req,res) =>{ 
    try{
        const data = fs.readFileSync('data.json','utf8');
        const viableData = JSON.parse(data) 

        res.status(200).json(viableData)
       } catch(e){
        console.log(`Failed To Sync File: ${e}`);
        res.status(500).json({ok:false,status:'failed to sync'})
       }

})

// Get Students By ID
app.get('/api/students/:id', verifyJWTMiddleware,(req,res) =>{
    const id = req.params.id; 
    
    try{
        const file = fs.readFileSync('data.json','utf8'); 
        const data = JSON.parse(file);
        
        const student = data.Students.find((student) => student.Student_ID === id); 

        res.status(200).json(student); 
    } catch(e){
        console.log(e)
        res.status(500).json({ok:false,status:'something went wrong'})
    }
})

// Elevate user (INCOMPLETE)
app.patch('/elevate/user',verifyJWTMiddleware,(req,res) =>{
     const token = req.headers.authorization.split(' ')[1]; 
     const updatedPayload ={
        token,
        isAdmin:true
     };
     
     jwt.sign(updatedPayload,secret,(err,decode) =>{
        if(err){
            res.status(500).json({ok:false,status:'failed to update token'})
        } else{
            res.status(203).json({ok:true,status:'Success'})
        }
     })
     console.log(token); 
})

// Add New Course

app.post('/courses/add',verifyJWTMiddleware,(req,res) =>{
    const token = req.headers.authorization.split(' ')[1]; 
    const decode = jwt.decode(token);

    console.log(decode); 

    
    const body = req.body; 

    try{
        const file = fs.readFileSync('data.json','utf8'); 
        const data = JSON.parse(file); 
        
        const latest = data.Courses.length + 1;  
        const newCourse = {
            Course_Code:`${latest}0${latest}`,
            ...body
        }

        data.Courses.push(newCourse); 
        
        const parsedData = JSON.stringify(data); 

        fs.writeFile('data.json',parsedData, (err) =>{
            if(err){
                throw new Error('Failed TO Write')
            }
        })
        res.status(200).json({ok:true, status:'Successful'}); 
    } catch(err){
        console.log(`An Error Occured: ${err}`)
        res.status(500).json({ok:false, status:'Something went wrong'})
    }

})
// Delete A Course 

app.post('/courses/delete', verifyJWTMiddleware, (req,res) =>{
    const courseToDelete = req.body.Course_Code; 
    
    try{
        const courseData = fs.readFileSync("data.json",'utf8'); 
        const parseData = JSON.parse(courseData); 

        const target = parseData.Courses.findIndex((c) => c.Course_Code === courseToDelete); 

        if(target < 0){
            res.status(404).json({ok:false,status:'Not Found'}); 
            return
        }

  
    parseData.Courses.splice(target,1);
    const viable = JSON.stringify(parseData);  

    fs.writeFile('data.json',viable,(err) =>{
        if(err){
            throw new Error('Failed To Write');  
        }
    })
    res.status(200).json({ok:true,status:'Removed'})
    } catch(err){
        console.log(err)
        res.status(500).json({ok:false,status:`Error Occured:${err.message}`});
    }
})
// Update Existing Course 

app.post('/courses/update', verifyJWTMiddleware, (req,res) =>{
    const update = req.body; 
    
    try{
        const courseData = fs.readFileSync("data.json",'utf8'); 
        const parseData = JSON.parse(courseData); 

        const target = parseData.Courses.findIndex((c) => c.Course_Code === update.Course_Code); 

        if(target < 0){
            res.status(404).json({ok:false,status:'Not Found'}); 
            return
        }

    const updatedCourse = {
        Course_Code:parseData["Courses"][target]["Course_Code"], 
        ...update
    }; 

    parseData.Courses.splice(target,1,updatedCourse);
    const viable = JSON.stringify(parseData);  

    fs.writeFile('data.json',viable,(err) =>{
        if(err){
            throw new Error('Failed To Write');  
        }
    })
    res.status(200).json({ok:true,status:'Updated'})
    } catch(err){
        console.log(err)
        res.status(500).json({ok:false,status:`Error Occured:${err.message}`});
    }
})

// Add Students 

app.post('/students/add', verifyJWTMiddleware, (req,res) =>{
     const newStudent = req.body; 

     try{
        const file = fs.readFileSync('data.json','utf8'); 
        const data = JSON.parse(file); 
        
        const findExisting = data.Students.filter((s) => s.First_Name === newStudent.First_Name && s.Last_Name === newStudent.Last_Name);
        
        if(findExisting.length){
            res.status(400).json({ok:false, status:'User Exists'})
        }

        const latest = data.Students.length + 1;
        const newUser = {
            Student_ID:latest,
            ...newStudent
        }; 

        data.Students.push(newUser); 
        const viable = JSON.stringify(data); 
        fs.writeFile('data.json',viable,(err) =>{
            if(err){
                throw new Error('Cant Write')
            }
        })

        res.status(203).json({ok:true})
     } catch(err){
        console.log(err); 
        res.status(500).json({ok:false, status:'Something Went Wrong'})
     }
})
// Delete Student
app.post('/students/delete', verifyJWTMiddleware, (req,res) =>{
    const studentToDelete = req.body.Student_ID; 

    try{
       const file = fs.readFileSync('data.json','utf8'); 
       const data = JSON.parse(file); 
       
       const target = data.Students.findIndex((s) => s.Student_ID === studentToDelete);
       
       if(target < 0){
           res.status(404).json({ok:false, status:'User Not Found'})
       }
       
       data.Students.splice(target,1); 
       
       const viable = JSON.stringify(data); 
       fs.writeFile('data.json',viable,(err) =>{
           if(err){
               throw new Error('Cant Write')
           }
       })

       res.status(203).json({ok:true})
    } catch(err){
       console.log(err); 
       res.status(500).json({ok:false, status:'Something Went Wrong'})
    }
})


// Update Student 

app.post('/students/update', verifyJWTMiddleware, (req,res) =>{
    const update = req.body; 

    try{
       const file = fs.readFileSync('data.json','utf8'); 
       const data = JSON.parse(file); 
       
       const target = data.Students.findIndex((s) => s.Student_ID === update.Student_ID);
       
       if(target < 0){
           res.status(404).json({ok:false, status:'User Not Found'})
       }
       
       data.Students.splice(target,1,update); 
       
       const viable = JSON.stringify(data); 
       fs.writeFile('data.json',viable,(err) =>{
           if(err){
               throw new Error('Cant Write')
           }
       })

       res.status(203).json({ok:true})
    } catch(err){
       console.log(err); 
       res.status(500).json({ok:false, status:'Something Went Wrong'})
    }
})


// Enroll A Student

app.post('/students/enroll', verifyJWTMiddleware, (req,res) =>{
    const info = req.body; 

    try{
        const file = fs.readFileSync('data.json', 'utf8'); 
        const data = JSON.parse(file); 

        const target = data.Students.findIndex((s) => s.Student_ID === info.Student_ID); 
        
        if(target < 0){
            res.status(404).json({ok:false,status:'Not Found'})
            return
        }
        
        data.Students[target]["course"] = info.Course_Code;
        const viable = JSON.stringify(data); 

        fs.writeFile('data.json',viable,(err) =>{
            if(err){
                throw new Error('Failed TO Write')
            }
        })
        
        res.status(200).json({ok:true,status:'Enrolled! Your Going TO College'})

    } catch(err){
        console.log(err); 
        res.status(500).json({ok:false,status:'something went wrong'})
    }
})

// Get Students Enrolled In Course

app.get('/students/enrollment/:id', verifyJWTMiddleware, (req,res) =>{
    const course = req.params.id; 

    try{
        const file = fs.readFileSync('data.json','utf8');
        const data = JSON.parse(file); 

        const getCourse = data.Courses.find((c) => c.Course_Code === course); 

        if(!getCourse){
            res.status(404).json({ok:false, status:'Not Found'});
            return
        }

        const getStudents = data.Students.filter((student) => student.course === course); 

        const studentClass = {
           Course:getCourse,
           Room:getStudents
        }; 

        res.status(200).json(studentClass)
    } catch(err){
        console.log(err); 
        res.status(500).json({ok:false, status:'Something Went Wrong'})
    }
})
app.listen(port,() => console.log(`listening @ ${port}`))