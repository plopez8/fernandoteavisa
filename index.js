const { Client, GatewayIntentBits } = require('discord.js')
const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const axios = require('axios');
require('dotenv/config')


const bot = new TelegramBot(process.env.TELEGRAMTOKEN, { polling: true });
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
})

client.on('ready', () => {
  console.log('Bot is ready!')
})



client.on('messageCreate', async message => {
if(message.author.bot === false){
  try {
    joinedchats = JSON.parse(fs.readFileSync('joinedChats.json', 'utf8'));
    if (joinedchats.length > 0 && message.author.bot === false) {
      const chatIds = joinedchats.filter(obj => obj.code === message.channelId)
        .map(obj => obj.chatId);
      chatIds.forEach(chat => {
        try{
          bot.sendMessage(chat, message.author.username + ' ha dicho: ' + message.content);
        }catch{
          console.log("error");
        }
        message.attachments.forEach(att => {
          switch (att.contentType) {
            case "image/jpeg":
              bot.sendPhoto(chat, att.url);
              break;
            case "video/mp4":
              bot.sendVideo(chat, att.url);
              break;
            case "audio/mpeg":
              bot.sendAudio(chat, att.url);
              break;
            default:
              bot.sendMessage(chat, att.url);
          }
        })
      });
    }
  } catch (err) {
    console.log('Error al analizar el archivo JSON: ', err);
  }


  if (message.content === '/getCode') {
    let serversIds = [];
    fs.readFile('discordcodes.json', 'utf8', (err, data) => {
      if(data != ""){
        if (!err) {
          try {
            serversIds = JSON.parse(data);
          } catch (err) {
            console.log('Error al analizar el archivo JSON: ', err);
          }
        }
        const joined = serversIds.includes(message.channelId);
        if (!joined) {
          serversIds.push(message.channelId);
          fs.writeFile('discordcodes.json', JSON.stringify(serversIds), (err) => {
            if (err) throw err;
          });
        }
        message.reply('El codigo de este canal es: ' + message.channelId);
      }else{
          serversIds.push(message.channelId);
          fs.writeFile('discordcodes.json', JSON.stringify(serversIds), (err) => {
            message.reply('El codigo de este canal es: ' + message.channelId);
            if (err) throw err;
          });
      }

    });
  }


  if (message.content === '/fernandohelpme') {
    message.reply('Los comandos disponibles son: \n /getCode - Obtienes un codigo para poder enlazar el canal de discord con el chat de telegram \n /fernandohelpme - Obtienes los comandos disponibles');
  }

}
});





bot.on('message', (msg) => {
  if (msg.text != undefined) {
    try {
      fs.readFile('joinedChats.json', 'utf8', (err, data) => {
        if( data != ""){       
        if (!err) {
          try {
            joinedchats = JSON.parse(data);

            const chatIds = joinedchats.filter(obj => obj.chatId === msg.chat.id)
            .map(obj => obj.code);
          chatIds.forEach(chat => {
            const channel = client.channels.cache.get(chat);
            channel.send("El usuario " + msg.from.username + " ha dicho: " + msg.text);
          });
          } catch (err) {
            console.log('Error al analizar el archivo JSON: ', err);
          }
        }
        }
      })
    } catch (err) {
      console.log(err);
    }
  }




  const command = msg.text.split('-')[0];
  const code = msg.text.split('-')[1];
  let joined;
  fs.readFile('joinedChats.json', 'utf8', (err, data) => {
    if (!err) {
      try {
        chatIds = JSON.parse(data.trim() !== '' ? data : '[]');
      } catch (err) {
        console.log('Error al analizar el archivo JSON: ', err);
      }
    } else if (err.code === 'ENOENT') {
      fs.writeFile('joinedChats.json', '[]', (err) => {
        if (err) throw console.log("falloaqui");
      });
    }
    for (let i = 0; i < chatIds.length; i++) {
      if (chatIds[i].code === code && chatIds[i].chatId === msg.chat.id) {
        joined = chatIds[i];
        break;
      }
    }



    
    if (msg.text === '/carrera') {
      axios.get('http://ergast.com/api/f1/current/last/results.json')
        .then(async response => {
          const results = response.data.MRData.RaceTable.Races[0].Results;
          bot.sendMessage(msg.chat.id, 'Ronda:' + response.data.MRData.RaceTable.Races[0].round + ' - ' + response.data.MRData.RaceTable.Races[0].raceName + ' - ' + response.data.MRData.RaceTable.Races[0].Circuit.circuitName)
          for (const posicion of results) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            await bot.sendMessage(msg.chat.id, 'Posicion:' + posicion.position + ' => [' + posicion.number + ' - ' + posicion.Driver.code + ' ] ' + posicion.Driver.givenName + ' ' + posicion.Driver.familyName + " - " + posicion.Driver.nationality + " - " + posicion.Constructor.name + " - Puntos:" + posicion.points + " - " + posicion.status);
          }
        })
        .catch(error => {
          console.log(error);
        });
    }





    if (msg.text === '/pilotos') {
      axios.get('http://ergast.com/api/f1/current/driverStandings.json')
        .then(async response => {
          console.log(response.data.MRData.StandingsTable.StandingsLists[0].DriverStandings);
          const results = response.data.MRData.StandingsTable.StandingsLists[0].DriverStandings;
          for (const posicion of results) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            await bot.sendMessage(msg.chat.id, 'Posicion:' + posicion.position + ' => [' + posicion.Driver.permanentNumber + ' - ' + posicion.Driver.code + ' ] ' + posicion.Driver.givenName + ' ' + posicion.Driver.familyName + " - " + posicion.Constructors[0].name + " - Puntos:" + posicion.points + " Wins:" + posicion.wins);
            console.log(posicion.Constructors[0].name)
          }
        })
        .catch(error => {
          console.log(error);
        });
    }



    if (msg.text === '/equipos') {
      axios.get('http://ergast.com/api/f1/current/constructorStandings.json')
        .then(async response => {
          console.log(response.data.MRData.StandingsTable.StandingsLists[0].ConstructorStandings);
          const results = response.data.MRData.StandingsTable.StandingsLists[0].ConstructorStandings;
          for (const posicion of results) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            console.log(posicion.Constructor.name);
            await bot.sendMessage(msg.chat.id, 'Posicion:' + posicion.position + ' => ' + posicion.Constructor.name + ' - ' + posicion.Constructor.nationality + " - Puntos:" + posicion.points + " Wins:" + posicion.wins);
          }
        })
        .catch(error => {
          console.log(error);
        });
    }

    if (msg.text === '/start') {
      bot.sendMessage(msg.chat.id, 'Los comandos disponibles son:  \n \n /join-codigo - Conecta un canal de discord con telegram. Con /getCode en discord puedes obtener el codigo (ex: /join-1234567789) \n \n /carrera - Muestra la clasificacion de la ultima carrera \n \n /pilotos - Muestra la clasificacion de pilotos \n \n /equipos - Muestra la clasificacion de equipos \n \n /help - Muestra los comandos disponibles')
    }


    if (msg.text === '/help') {
      bot.sendMessage(msg.chat.id, 'Los comandos disponibles son:  \n \n /join-codigo - Conecta un canal de discord con telegram. Con /getCode en discord puedes obtener el codigo (ex: /join-1234567789) \n \n /carrera - Muestra la clasificacion de la ultima carrera \n \n /pilotos - Muestra la clasificacion de pilotos \n \n /equipos - Muestra la clasificacion de equipos \n \n /help - Muestra los comandos disponibles')
    }




    if (command === '/join' && code && !joined) {
      fs.readFile('discordcodes.json', 'utf8', (err, data) => {
        if (!err) {
          try {
            const discordCodes = JSON.parse(data);
            let server;
            if (discordCodes.length == 0) {
              server = false;
            } else {
              for (let i = 0; i < discordCodes.length; i++) {
                if (discordCodes[i] === code) {
                  server = discordCodes[i];
                  break;
                }
              }
            }
            if (server) {
              chatIds.push({ code, chatId: msg.chat.id });
              fs.writeFile('joinedChats.json', JSON.stringify(chatIds), (err) => {
                bot.sendMessage(msg.chat.id, '¡Te has unido correctamente!');  
                if (err) throw err;
              });

            } else {
              bot.sendMessage(msg.chat.id, 'Código inválido');
            }
          } catch (err) {
            console.log('Error al analizar el archivo JSON: ', err);
          }
        } else {
          console.log('Error al leer el archivo JSON: ', err);
        }
      });
    } else if (joined) {
      bot.sendMessage(msg.chat.id, '¡Te has unido correctamente!');
    }
  });
});



client.login(process.env.DISCORDTOKEN)