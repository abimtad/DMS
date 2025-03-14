import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { STATUS_CODES } from "http";
import { NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { hash } from "bcrypt";

const userSchema = z.object({
  username: z.string().min(1, "username must "),
  email: z.string().email("email needed"),
  password: z.string().min(4, "the passwd must greater than 4 char"),
});

export async function POST(req: Request, res: Response) {
  try {
    const body = await req.json();

    const validation = userSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({
        error: validation.error.flatten().fieldErrors,
        msg: "validation",
        status: 409,
      });
    }
    const { username, email, password } = validation.data;
    const existingUser = await db.user.findUnique({
      where: { email },
    });
    if (existingUser) {
      return NextResponse.json({
        message: "user with this email exist",
        status: 403,
      });
    }
    const userName = await db.user.findUnique({
      where: { username },
    });
    if (userName) {
      return NextResponse.json({
        message: "username exist",
        status: 403,
      });
    }

    const hashpassword = await hash(password, 10);
    const userCreated = await db.user.create({
      data: {
        username,
        email,
        password: hashpassword,
      },
    });
    const { password: passwd, ...userInfo } = userCreated;
    if (!userCreated) {
      return NextResponse.json({
        message: "failed while creating your account",
        error: 409,
      });
    }
    return NextResponse.json({
      msg: "user create successfully",
      user: userInfo,
    });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({
        error: error.message,
        status: 409,
      });
    }
    if (error instanceof ZodError) {
      return NextResponse.json({
        error: error.flatten().fieldErrors,
        status: 409,
      });
    }
    return NextResponse.json({
      error: "status error",
      status: 500,
    });
  }
}
