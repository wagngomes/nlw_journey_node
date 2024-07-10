import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import {date, string, z} from 'zod'
import { prisma } from "../lib/prisma";
import dayjs from "dayjs";
import { getMailClient } from "../lib/mail";
import nodemailer from 'nodemailer'
import localizedFormat from 'dayjs/plugin/localizedFormat'
import 'dayjs/locale/pt-br'

dayjs.locale('pt-br')
dayjs.extend(localizedFormat)

export async function createLink(app: FastifyInstance) {
    app.withTypeProvider<ZodTypeProvider>().post('/trips/:tripId/links', {
        schema: {
            params: z.object({
                tripId: string().uuid(),
            }),
            body: z.object({
                title: z.string().min(4),
                url: z.string().url()

            })
        }
    } ,async(request) => {
        const { tripId } = request.params
        const {title, url} = request.body


        const trip = await prisma.trip.findUnique({
            where:{
                id: tripId
            }
        })

        if (!trip) {
            throw new Error('Trip not found')
        }

        const link = await prisma.link.create({
            data: {
                title,
                url,
                tripId,

            }
        })



        return {
            linkId: link.id
        }
    })
}