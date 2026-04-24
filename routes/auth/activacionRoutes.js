const express = require('express');
const User = require('../../models/UserSchema');
const Profile = require('../../models/ProfileSchema');
const { enviarCorreoBienvenida } = require('../../helpers/mailLibs');

const router = express.Router();

router.put("/", async (req, res) => {

     console.log(req.body);
    try {
      const { token, username } = req.body;

     

      const user = await User.findOne({ token }) || null;

      if (!user) {
        return res.status(409).json({ message: "No se puede activar cuenta, el usuario no existe" });
      }

      if (user.username !== username) {
        return res.status(409).json({ message: "Los datos no son correctos" });
      }

      if (user.state === true) {
        return res.status(409).json({ message: "La cuenta ya está activada." });
      }

      const resultado = await User.updateOne(
        { _id: user._id },
        {
          $set: {
            token: "Activo",
            state: true,
          },
        }
      );

      await Profile.create({
        firstName: '',
        lastName: '',
        email: '',
        location: '',
        phoneNumber: '',
        chanelName: user.username,
        description: '',
        linksString: '',
        socialMedia: [],
        instantMessages: [],
        profilePic: [],
        userBy: user._id,
      });

      enviarCorreoBienvenida(user.email, user.username).catch(e =>
        console.error('[Mail] Error al enviar bienvenida:', e.message)
      );

      return res.status(200).json(resultado);

    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  });

module.exports = router;
