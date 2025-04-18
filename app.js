import { config } from 'dotenv-safe'
import Discord from 'discord.js'
import { Cron } from './modules/cron.js'
import azureHealthServer from './modules/azureHealthServer.js'
import { pingJava } from '@minescope/mineping'
import JSONdb from 'simple-json-db'
config()
const bot = new Discord.Client({
  intents: [
    Discord.GatewayIntentBits.GuildMessages
  ]
})

const jobs = new Cron()
const db = new JSONdb('./.db.json')
const currentlyOnlinePlayers = []

bot.on(Discord.Events.ClientReady, async () => {
  console.log('Connected to Discord API servers')
  console.log(`Logged in as: ${bot.user.username}.`)
  azureHealthServer.startHTTPServer()

  console.log('')
  console.log('Awaiting commands!')
  console.log('')

  bot.user.setStatus(Discord.PresenceUpdateStatus.DoNotDisturb)
  jobs.add('update-status', '0 * * * * *', () => updateStatus())
  updateStatus()
})

console.log('Connecting to Discord API servers')
bot.login(process.env.DISCORD_API_KEY)

async function updateStatus() {
  console.log('Updating status')

  if (!bot.channels.cache.has(process.env.DISCORD_CHANNEL_ID)) {
    await bot.channels.fetch(process.env.DISCORD_CHANNEL_ID)
  }

  if (await bot.channels.cache.get(process.env.DISCORD_CHANNEL_ID) === undefined) {
    return console.log('Channel doesn\'t exist')
  }

  const channel = await bot.channels.cache.get(process.env.DISCORD_CHANNEL_ID)

  const data = await pingJava(process.env.MC_SERVER_IP).catch(err => {
    console.log('Couldn\'t update status, error:')
    console.log(err)
    return undefined
  })

  if (data === undefined) {
    console.log('Couldn\'t update status, is the server online?')
    return
  }

  const onlinePlayers = data.players.sample ? data.players.sample : []

  const onlinePlayerUUIDs = onlinePlayers.map(player => player.id)
  const playersToRemove = currentlyOnlinePlayers.filter(uuid => !onlinePlayerUUIDs.includes(uuid))
  for (const uuid of playersToRemove) {
    if (!db.has(uuid)) {
      console.error(`Curreently online player ${uuid} that has left, was not found in player db`)
      return
    }
    const playerData = db.get(uuid)
    const currentSessionTime = Date.now() - playerData.lastJoin
    playerData.timePlayed = (playerData.timePlayed || 0) + currentSessionTime
    playerData.lastLeave = Date.now()
    db.set(uuid, playerData)
    currentlyOnlinePlayers.splice(currentlyOnlinePlayers.indexOf(uuid), 1)
    console.log(`Player left: ${playerData.name} (${uuid})\n ${playerData.joins} joins\n ${currentSessionTime}ms session played\n ${playerData.timePlayed}ms total played\n ${playerData.firstJoin} first join`)

    const embed = new Discord.EmbedBuilder()
      .setTitle(playerData.name)
      .setDescription('Player Left')
      .addFields(
        {
          name: 'Joins',
          value: `${playerData.joins}`,
          inline: true
        },
        {
          name: 'First joined',
          value: `${new Date(playerData.firstJoin).toLocaleString()}`,
          inline: true
        },
        {
          name: 'Session play time',
          value: `${Math.floor(currentSessionTime / 1000 / 60)} minutes`,
          inline: false
        },
        {
          name: 'Total play time',
          value: `${Math.floor(playerData.timePlayed / 1000 / 60)} minutes`,
          inline: false
        },
        {
          name: 'UUID',
          value: `${uuid}`,
          inline: false
        }
      )
      .setColor('#f5003d')
      .setFooter({
        text: process.env.MC_SERVER_NAME + ' - ' + data.version.name
      })
      .setTimestamp()
    await channel.send({ embeds: [embed] })
  }

  for (const player of onlinePlayers) {
    if (currentlyOnlinePlayers.includes(player.id)) {
      console.log(`Player ${player.name} (${player.id}) is already online`)
      continue
    }
    if (db.has(player.id)) {
      // Returning player joined
      const playerData = db.get(player.id)
      currentlyOnlinePlayers.push(player.id)
      playerData.lastJoin = Date.now()
      playerData.joins = playerData.joins + 1
      db.set(player.id, playerData)
      const playTime = playerData.timePlayed || 0
      console.log(`Returning player joined: ${player.name} (${player.id})\n ${playerData.joins} joins\n ${playTime}ms total played\n ${playerData.firstJoin} first join`)

      const embed = new Discord.EmbedBuilder()
        .setTitle(player.name)
        .setDescription('Returning Player Joined')
        .addFields(
          {
            name: 'Joins',
            value: `${playerData.joins}`,
            inline: true
          },
          {
            name: 'First joined',
            value: `${new Date(playerData.firstJoin).toLocaleString()}`,
            inline: true
          },
          {
            name: 'Total play time',
            value: `${Math.floor(playTime / 1000 / 60)} minutes`,
            inline: false
          },
          {
            name: 'UUID',
            value: `${player.id}`,
            inline: false
          }
        )
        .setColor('#56f500')
        .setFooter({
          text: process.env.MC_SERVER_NAME + ' - ' + data.version.name
        })
        .setTimestamp()
      await channel.send({ embeds: [embed] })
    } else {
      // New player joined
      currentlyOnlinePlayers.push(player.id)
      db.set(player.id, {
        name: player.name,
        uuid: player.id,
        joins: 1,
        firstJoin: Date.now(),
        lastJoin: Date.now()
      })
      console.log(`New player joined: ${player.name} (${player.id})`)

      const embed = new Discord.EmbedBuilder()
        .setTitle(player.name)
        .setDescription('New Player Joined')
        .addFields(
          {
            name: 'UUID',
            value: `${player.id}`,
            inline: false
          }
        )
        .setColor('#00e4f5')
        .setFooter({
          text: process.env.MC_SERVER_NAME + ' - ' + data.version.name
        })
        .setTimestamp()
      await channel.send({ embeds: [embed] })
    }
  }
}
