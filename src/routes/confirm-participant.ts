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


export async function confirmPaticipants(app: FastifyInstance) {
    app.withTypeProvider<ZodTypeProvider>().get('/paticipants/:participantId/confirm', {
        schema: {
            params: z.object({
                participantId: z.string().uuid()
            })
        }
    } ,async(request, reply) => {

        const {participantId} = request.params

        const participant  = await prisma.participant.findUnique({
            where: {
                id: participantId
            }
        })

        if (!participant) {
            throw new Error('Participant not found')
        }
        if (participant.is_confirmed) {

            return reply.redirect(`http://localhost/3000/trips/${participant.tripId}`)

        }

        await prisma.participant.update({
            where: {
                id: participantId
            },
            data: {
                is_confirmed: true
            }

        })

        return reply.redirect(`http://localhost/3000/trips/${participant.tripId}`)
    })
}