const express = require('express');
const cors = require('cors');
const fs = require('fs');
const bodyParser = require('body-parser');
const multer = require('multer');
const { Sequelize, DataTypes } = require('sequelize');
// const { Configuration, OpenAIApi } = require('openai');
// OpenAIApi V3 to V4 update
const { OpenAI } = require('openai');
// import OpenAI from 'https://deno.land/x/openai@v4.49.1/mod.ts';
require('dotenv').config();

// Initialize Express
const app = express();
app.use(cors());
app.use(bodyParser.json());

// const configuration = new Configuration({
//     apiKey: process.env.OPENAI_API_KEY,
// });

// V3 to V4 update
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY // This is also the default, can be omitted
  });

  

// Initialize Sequelize
const sequelize = new Sequelize('take2_db', process.env.USERNAME_DB, process.env.PASSWORD_DB, {
    host: 'localhost',
    dialect: 'mysql'
});

// Define Models
const User = sequelize.define('User', {
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    phone: {
        type: DataTypes.STRING,
        allowNull: false
    }
});

const Task = sequelize.define('Task', {
    description: {
        type: DataTypes.STRING,
        allowNull: false
    }
});

const Submission = sequelize.define('Submission', {
    audioUrl: {
        type: DataTypes.STRING,
        allowNull: false
    },
    transcript: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    score: {
        type: DataTypes.FLOAT,
        allowNull: false
    }
});

User.hasMany(Submission);
Submission.belongsTo(User);
Task.hasMany(Submission);
Submission.belongsTo(Task);

// Sync Database
sequelize.sync();

// Routes
app.post('/api/users', async (req, res) => {
    const { name, email, phone } = req.body;
    try {
        const user = await User.create({ name, email, phone });
        console.log(user);
        res.send({ userId: user.id });
    } catch (error) {
        console.error(error);
        res.status(500).send(error);
    }
});

// const upload = multer({ dest: 'uploads/' });

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '.mp3');
    }
});
const upload = multer({ storage: storage });

app.post('/api/submissions', upload.single('audio'), async (req, res) => {
    const { userId, taskId } = req.body;
    const audioUrl = req.file.path;
    console.log(audioUrl)

    try {
        // Replace the following two lines with actual API calls when ready
        // const transcript = await openai.createTranscription({
        //     model: 'whisper-1',
        //     file: audioUrl,
        // });

        const transcript = await openai.audio.transcriptions.create({
            language: "en",
            model: 'whisper-1',
            file: audioUrl,
        });
        console.log("end of transcript")
        const transcription = transcript.data.transcription;
        console.log(transcription)

        // const transcription = "Hi this is take2ai, everything went well";

        // Score transcript
        // Replace the following two lines with actual API calls when ready
        // const response = await openai.createCompletion({
        //     model: "text-davinci-003",
        //     prompt: `Score the following text for grammatical correctness on a scale of 1 to 10:\n\n${transcription}`,
        //     max_tokens: 10,
        // });
        // const score = parseFloat(response.choices[0].text.trim());

        const score = 9;

        const submission = await Submission.create({ userId, taskId, audioUrl, transcript: transcription, score });
        res.send({ submissionId: submission.id, score });
    } catch (error) {
        console.error(error);
        res.status(500).send(error);
    }
});

app.get('/api/submissions/:id', async (req, res) => {
    try {
        const submission = await Submission.findByPk(req.params.id, {
            include: [User, Task]
        });
        if (!submission) {
            return res.status(404).send('Submission not found');
        }
        res.send(submission);
    } catch (error) {
        res.status(500).send(error);
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
