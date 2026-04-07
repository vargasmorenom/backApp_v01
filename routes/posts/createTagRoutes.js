const express = require('express');
const TagsPost = require('../../models/TagsPost');

const router = express.Router();

router.post("/", async (req, res) => {
    try {
        const { name } = req.body;

        if (!name) {
            return res.status(400).json({ message: "El nombre del tag es obligatorio" });
        }

        // Generar slug simple basado en el nombre (minúsculas, sin espacios, caracteres especiales)
        const slug = name.toString().toLowerCase()
            .trim()
            .replace(/\s+/g, '-')           // Reemplazar espacios con -
            .replace(/[^\w\-]+/g, '')       // Eliminar caracteres no alfanuméricos (excepto -)
            .replace(/\-\-+/g, '-');        // Reemplazar múltiples - con uno solo

        // Verificar si ya existe por nombre o slug
        const existingTag = await TagsPost.findOne({ 
            $or: [{ name: name.toLowerCase().trim() }, { slug }] 
        });

        if (existingTag) {
            return res.status(200).json({ 
                message: "El tag ya existe", 
                tag: existingTag 
            });
        }

        const newTag = await TagsPost.create({
            name,
            slug
        });

        return res.status(201).json({ 
            message: "Tag creado correctamente", 
            tag: newTag 
        });

    } catch (error) {
        console.error("Error al crear el Tag:", error);
        return res.status(500).json({ message: "Error interno del servidor" });
    }
});

module.exports = router;