import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import {date, z} from 'zod'
import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { getMailClient } from "../lib/mail";
import dayjs from "dayjs";
import nodemailer from 'nodemailer'
import localizedFormat from 'dayjs/plugin/localizedFormat'
import 'dayjs/locale/pt-br'

dayjs.locale('pt-br')
dayjs.extend(localizedFormat)


export async function confirmTrip(app: FastifyInstance) {
    app.withTypeProvider<ZodTypeProvider>().get('/trips/:tripId/confirm', {
        schema: {
            params: z.object({
                tripId: z.string().uuid()
            })
        }
    } ,async(request, reply) => {

        const {tripId} = request.params

        const trip = await prisma.trip.findUnique({
            where: {
                id: tripId
            },
            include: {
                participants: {
                    where: {
                        is_owner: false
                    }
                }
            }
        })

        if (!trip){
            throw new Error('Trip not found')
        }
        if (trip.is_confirmed) {
            return reply.redirect(`http://localhost/3000/trips/${tripId}`)
        }

        await prisma.trip.update({
            where: {
                id: tripId
            },
            data: {
                is_confirmed: true
            }
        })

        const formattedStartDate = dayjs(trip.starts_at).format('LL')
        const formattedEndDate = dayjs(trip.ends_at).format('LL')

        const mail = await getMailClient()

        await Promise.all(
            trip.participants.map(async (participant) => {

                const confirmationLink = `http://localhost/3333/participants/${participant.id}/confirm`

                const message = await mail.sendMail({
                    from: {
                        name: 'Equipe planner',
                        address: 'wagner.gomes@gmail.com'
                    },
                    to: participant.email,

                    subject: `Você foi convidado para uma viagem para ${trip.destination} em ${formattedStartDate}`,
                    html: `
        
                    <div style="font-family: sans-serif;font-size: 16px;line-height: 1.6;">
        
                    <p>Sua viagem para <strong>${trip.destination}, Brasil</strong> entre as datas de ${formattedStartDate} até ${formattedEndDate}.</p>
                    <p></p>
                    <P>Para confimar sua presença clique no link abaixo:</P>
                    <p></p>
                    <p>
                    <a href="${confirmationLink}">Confirmar viagem</a>
                    </p>
                    <p>Caso voc~e não saiba do que se trate, ignore esse email</p>
                    </div>           
                    `.trim()
                })
        
                console.log(nodemailer.getTestMessageUrl(message))
        

            })
        )


        return reply.redirect(`http://localhost/3000/trips/${tripId}`)
    })
}