/*
 * Austin McCalley 2020
 * Process file for the points listener
 *
 *
 * TODO: Add create user in util
 * TODO: Add update user in util
 * TODO: Add update points for user in util
 */

import { Client, Message } from 'discord.js'
import { ConfigInterface } from '../types/interfaces/ConfigInterface'
import { ProcessInterface } from '../types/interfaces/ProcessInterface'
import { SubmodulesInterface } from '../types/interfaces/SubmodulesInterface'

import fetch from 'node-fetch'
import * as jwt from 'jsonwebtoken'

export const pointsListener: ProcessInterface = {
    name: 'PointsListener',
    init(client: Client, config: ConfigInterface, sub: SubmodulesInterface) {
        client.on('message', async (message: Message) => {
            if (message.author.bot) return

            const author = message.author
            const authorID = author.id
            const channel = message.channel.id
            const content = message.content
            const userRoleNames = message.member.roles.cache.map(r => r.name)

            // TODO: Get thanks from config
            // TODO: Thanks command? POSSIBILITY
            if (
                message.channel.type !== 'dm' &&
                !message.author.bot &&
                ['thank', 'kudos'].some(t =>
                    message.content.toLowerCase().includes(t)
                )
            ) {
                const thankees = message.mentions.users.filter(
                    thankee => thankee !== undefined
                )

                // If the thanker is in the list of thankees, send an error message.
                if (thankees.map(thankee => thankee.id).includes(authorID)) {
                    return message.reply(
                        'You cant thank yourself! You silly goose!'
                    )
                }

                let thankeesArray = thankees.map(user => user.id)
                let thankeesString = thankeesArray.toString()
                let allIds = thankeesArray
                allIds.push(authorID)

                // Sign header to get data
                // TODO: Add secret to config file
                jwt.sign({ bot: client.user.id }, 'test', (err, token) => {
                    // TODO: Handle this error better
                    if (err) throw Error(err)

                    const headers = {
                        Authorization: 'Bearer ' + token
                    }

                    fetch(
                        `http://127.0.0.1:3000/user/multiple/${authorID},${thankeesString}`,
                        { headers }
                    )
                        .then(res => res.json())
                        .then(ret => {
                            // TODO: Check if invalid signature
                            // console.log(ret.length, thankeesArray.length + 1)
                            if (ret.length !== thankeesArray.length + 1) {
                                let users = ret.map(user => user.id)

                                if (ret.length > 0) {
                                    // ONLY IF ret.length > 0
                                    users.forEach(u => {
                                        if (!thankeesArray.includes(u)) {
                                            // TODO: Create user
                                            let params = {
                                                id: u,
                                                multiplier: 1
                                            }

                                            fetch(
                                                `http://127.0.0.1:3000/user`,
                                                {
                                                    method: 'POST',
                                                    body: JSON.stringify(
                                                        params
                                                    ),
                                                    headers: {
                                                        'Content-Type':
                                                            'application/json',
                                                        Authorization:
                                                            'Bearer ' + token
                                                    }
                                                }
                                            )
                                                .then(res => res.text())
                                                .then(j => {
                                                    // NOTE: Confirmation of finish
                                                })
                                        }
                                    })
                                } else {
                                    allIds.forEach(id => {
                                        let params = {
                                            id,
                                            multiplier: 1
                                        }

                                        fetch(`http://127.0.0.1:3000/user`, {
                                            method: 'POST',
                                            body: JSON.stringify(params),
                                            headers: {
                                                'Content-Type':
                                                    'application/json',
                                                Authorization: 'Bearer ' + token
                                            }
                                        })
                                            .then(res => res.json())
                                            .then(j => {
                                                // NOTE: Confirmation of finish
                                            })
                                    })
                                }
                            } else {
                                console.log('Same sizes')
                            }
                        })
                })
            }
        })
    }
}
