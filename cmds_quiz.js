
const {User, Quiz, Score} = require("./model.js").models;
const { Sequelize, Model, DataTypes } = require('sequelize');

const options = { logging: false};
const sequelize = new Sequelize("sqlite:db.sqlite", options);

// Show all quizzes in DB including <id> and <author>
exports.list = async (rl) =>  {

  let quizzes = await Quiz.findAll(
    { include: [{
        model: User,
        as: 'author'
      }]
    }
  );
  quizzes.forEach( 
    q => rl.log(`  "${q.question}" (by ${q.author.name}, id=${q.id})`)
  );
}

// Create quiz with <question> and <answer> in the DB
exports.create = async (rl) => {

  let name = await rl.questionP("Enter user");
    let user = await User.findOne({where: {name}});
    if (!user) throw new Error(`User ('${name}') doesn't exist!`);

    let question = await rl.questionP("Enter question");
    if (!question) throw new Error("Response can't be empty!");

    let answer = await rl.questionP("Enter answer");
    if (!answer) throw new Error("Response can't be empty!");

    await Quiz.create( 
      { question,
        answer, 
        authorId: user.id
      }
    );
    rl.log(`   User ${name} creates quiz: ${question} -> ${answer}`);
}

// Test (play) quiz identified by <id>
exports.test = async (rl) => {

  let id = await rl.questionP("Enter quiz Id");
  let quiz = await Quiz.findByPk(Number(id));
  if (!quiz) throw new Error(`  Quiz '${id}' is not in DB`);

  let answered = await rl.questionP(quiz.question);

  if (answered.toLowerCase().trim()===quiz.answer.toLowerCase().trim()) {
    rl.log(`  The answer "${answered}" is right!`);
  } else {
    rl.log(`  The answer "${answered}" is wrong!`);
  }
}

// Update quiz (identified by <id>) in the DB
exports.update = async (rl) => {

  let id = await rl.questionP("Enter quizId");
  let quiz = await Quiz.findByPk(Number(id));

  let question = await rl.questionP(`Enter question (${quiz.question})`);
  if (!question) throw new Error("Response can't be empty!");

  let answer = await rl.questionP(`Enter answer (${quiz.answer})`);
  if (!answer) throw new Error("Response can't be empty!");

  quiz.question = question;
  quiz.answer = answer;
  await quiz.save({fields: ["question", "answer"]});

  rl.log(`  Quiz ${id} updated to: ${question} -> ${answer}`);
}

// Delete quiz & favourites (with relation: onDelete: 'cascade')
exports.delete = async (rl) => {

  let id = await rl.questionP("Enter quiz Id");
  let n = await Quiz.destroy({where: {id}});
  
  if (n===0) throw new Error(`  ${id} not in DB`);
  rl.log(`  ${id} deleted from DB`);
}

//Play


exports.play = async (rl) => {

let resueltos = [];
let score=0;

  while (await Quiz.count({where: {id: {[Sequelize.Op.notIn]:resueltos}}})){ //resultado if = quizes sin contestar

    let c = await Quiz.count({where: {id: {[Sequelize.Op.notIn]:resueltos}}});

    //console.log(`Preguntas sin resolver: ${c}\n`);
    
    let quiz = await Quiz.findOne({where: {id: {[Sequelize.Op.notIn]:resueltos}}, 
      offset: Math.floor(Math.random()*c)}
      );
    if (!quiz) throw new Error(`error`);

    //console.log(`Id de pregunta a resolver: ${quiz.id}`);

    let contestacion = await rl.questionP(quiz.question);
    if (!contestacion) throw new Error("Response can't be empty!");

    resueltos.push(quiz.id);

    //console.log(`contenido de resueltos ${resueltos}`);

    if (contestacion.toLowerCase().trim()===quiz.answer.toLowerCase().trim()) {

      rl.log(`The answer "${contestacion}" is right! `);
      score++;
    }

    else {
    rl.log(`The answer "${contestacion}" is wrong! `);
    break;
    }
  }
  rl.log(`Score: ${score}`);

  let name = await rl.questionP('Whats your name?');
  if (!name) throw new Error("Response can't be empty!");

  let [user, o] = await User.findOrCreate({where: {name}, defaults: {age: 0}});

  console.log(`id de usuario creado ${user.id}`);

  let sobj = await Score.create({wins: score});
  await user.addScore(sobj);


  console.log(`User score y score: ${user.wins} y ${score}`);

}

exports.score = async (rl) => {
  //let users = await User.findAll();
  const event = new Date('18 Feb 2020 14:20:27 GMT');
  let scores = await Score.findAll({
    include: {model: User, as: 'user'
  },
    order: [['wins', 'DESC']]
  });

  for(s of scores){
    rl.log(`${s.user.name}|${s.wins}|${event.toUTCString()}`);
  }
    
}

