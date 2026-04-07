// strategies/contentStrategies.js
module.exports = {
  photo: async (url) => {
    // Configuración para fotos
    const id = url.split("/");
    const val = id[4].split('=');
    const dl =val[1].split("&");
    const dl1 =val[2].split("&");
    return {
      url,
      tipo: "photo",
      id: dl[0],
      id1: dl1[0],
      data: id,

    };
  },

  reel: async (url) => {
    // Configuración para reels
    const id = url.split("/");
    return {
      url,
      tipo: "reel",
      id: id[4],
      data: id,

    };
  },

  watch: async (url) => {
    // Configuración para videos "watch"
    const id = url.split("/");
    return {
      url,
      tipo: "videos",
      user: id[3],
      id: id[5],
      data: id,
   
    };
  },

  posts: async (url) => {
    // Configuración para posts
    const id = url.split("/");
    return {
      url,
      tipo: "posts",
      id: id[5] + "/" + id[6],
      data: id,

    };
  },

  videos: async (url) => {
    // Configuración para videos
    const id = url.split("/");
    return {
      url,
      tipo: "videos",
      user: id[3],
      id: id[5],
      data: id,
   
    };
  }
};