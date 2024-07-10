import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import {date, z} from 'zod'
import { prisma } from "../lib/prisma";
import dayjs from "dayjs";
import { getMailClient } from "../lib/mail";
import nodemailer from 'nodemailer'
import localizedFormat from 'dayjs/plugin/localizedFormat'
import 'dayjs/locale/pt-br'

dayjs.locale('pt-br')
dayjs.extend(localizedFormat)

export async function createTrip(app: FastifyInstance) {
    app.withTypeProvider<ZodTypeProvider>().post('/trips', {
        schema: {
            body: z.object({
                destination: z.string().min(4),
                starts_at: z.coerce.date(),
                ends_at: z.coerce.date(),
                owner_name: z.string(),
                owner_email: z.string().email(),
                emails_to_invite: z.array(z.string().email())
            })
        }
    } ,async(request) => {
        const {destination, ends_at, starts_at, owner_name, owner_email, emails_to_invite} = request.body

        if(dayjs(starts_at).isBefore(new Date())){
            throw new Error ('invalid trip start date')
        }

        if(dayjs(ends_at).isBefore(starts_at)){
            throw new Error ('invalid trip end date')
        }

        const trip = await prisma.trip.create({
            data: {
                destination,
                starts_at,
                ends_at,
                participants: {
                    createMany: {
                        data: [
                            {
                                name: owner_name,
                                email: owner_email,
                                is_owner: true,
                                is_confirmed: true
                            },
                            ...emails_to_invite.map(email => {
                                return {email}
                            })
                            
                        ],


                    }
                }
            }
        })

        const formattedStartDate = dayjs(starts_at).format('LL')
        const formattedEndDate = dayjs(ends_at).format('LL')

        const confirmationLink = `http://localhost/3333/trips/${trip.id}/confirm`

        const mail = await getMailClient()

        const message = await mail.sendMail({
            from: {
                name: 'Equipe planner',
                address: 'wagner.gomes@gmail.com'
            },
            to: {
                name: owner_name,
                address: owner_email           
            },
            subject: `Confirme sua viagem para ${destination} em ${formattedStartDate}`,
            html: `

            <div style="font-family: sans-serif;font-size: 16px;line-height: 1.6;">

            <p>Você solicitou a viagem para <strong>${destination}, Brasil</strong> entre as datas de ${formattedStartDate} até ${formattedEndDate}.</p>
            <p></p>
            <P>Para confimar sua viagem clique no link abaixo:</P>
            <p></p>
            <p>
            <a href="${confirmationLink}">Confirmar viagem</a>
            </p>
            <p>Caso voc~e não saiba do que se trate, ignore esse email</p>
            </div>           
            `.trim()
        })

        console.log(nodemailer.getTestMessageUrl(message))

        return {
            tripId: trip.id
        }
    })
}