import { getIncludeParams, prisma } from "../lib/database.js";
import { PracticeBaseSchema } from "../lib/zod.js";
export const GetPractices = async (c) => {
    const practices = await prisma.practice.findMany({
        include: getIncludeParams(c),
    });
    return c.json(practices);
};
export const NewPractice = async (c) => {
    const data = PracticeBaseSchema.omit({ id: true }).parse(await c.req.json());
    const practice = await prisma.practice.create({ data });
    return c.json(practice);
};
export const UpdatePractice = async (c) => {
    const id = c.req.param("id");
    const data = PracticeBaseSchema.omit({ id: true }).parse(await c.req.json());
    const practice = await prisma.practice.update({
        where: { id },
        data,
    });
    return c.json(practice);
};
export const DeletePractice = async (c) => {
    const id = c.req.param("id");
    await prisma.practice.delete({ where: { id } });
    return c.json({ message: "Practice Deleted" });
};
