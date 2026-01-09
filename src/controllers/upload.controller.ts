import cloudinary from "../lib/cloudinary";
import { prisma } from "../lib/prisma";

export const uploadPhoto = async (req: any, res: any) => {
  try {
    const me = req.user;
    const file = req.file;

    if (!me || !file) {
      return res.status(400).json({ message: "Invalid upload" });
    }

    const count = await prisma.photo.count({
      where: { userId: me.id },
    });

    if (count >= 5) {
      return res.status(400).json({ message: "Maximum 5 photos allowed" });
    }

    const upload = await cloudinary.uploader.upload(file.path, {
      folder: "myfriend/users",
    });

    const photo = await prisma.photo.create({
      data: {
        url: upload.secure_url,
        userId: me.id,
      },
    });

    // ✅ only auto-set if FIRST photo
    if (count === 0) {
      await prisma.user.update({
        where: { id: me.id },
        data: { profilePhoto: photo.url },
      });
    }

    res.json({
      url: photo.url,
      photoCount: count + 1,
    });
  } catch {
    res.status(400).json({ message: "Upload failed" });
  }
};
