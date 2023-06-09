import { NextApiRequest, NextApiResponse } from "next";

import serverAuth from "@/libs/serverAuth";
import prisma from "@/libs/prismadb";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).end();
  }

  try {
    const { userId } = req.body;
    const { currentUser } = await serverAuth(req, res);

    if (!userId || typeof userId !== "string") {
      throw new Error("Invalid ID");
    }

    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user) throw new Error("Invalid ID");

    let updatedFollowingIds = [...(user.followingIds || [])];

    updatedFollowingIds.push(userId);

    try {
      await prisma.notifications.create({
        data: {
          body: "Someone followed you!",
          userId,
        },
      });

      await prisma.user.update({
        where: {
          id: userId,
        },
        data: {
          hasNotifications: true,
        },
      });
    } catch (err) {
      console.log(err);
    }

    const updatedUser = await prisma.user.update({
      where: {
        id: currentUser.id,
      },
      data: {
        followingIds: updatedFollowingIds,
      },
    });

    return res.status(200).json(updatedUser);
  } catch (err) {
    console.log(err);
    return res.status(400).end();
  }
}
