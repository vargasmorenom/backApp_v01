function generarCombinacion() {
    // Generar 6 números aleatorios entre 1 y 99 (puedes ajustar el rango)
    const numeros = Array.from({length: 6}, () => Math.floor(Math.random() * 9) + 1);
    
    // Generar 3 letras aleatorias (mayúsculas)
    const letras = Array.from({length: 3}, () => {
      const codigoAscii = Math.floor(Math.random() * 26) + 65; // A-Z en ASCII
      return String.fromCharCode(codigoAscii);
    });
    
    // Combinar números y letras
    const combinacion = [...numeros, ...letras];
    
    // Mezclar los elementos para que no estén todos los números primero
    for (let i = combinacion.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [combinacion[i], combinacion[j]] = [combinacion[j], combinacion[i]];
    }
    
    return combinacion;
  }
  


module.exports = generarCombinacion ;