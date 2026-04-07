const bsc = require("bcrypt");

class ClaveSession{

    constructor(max) {

       this.max = max;
      }

      salida(){
        let salida = Math.floor(Math.random() * this.max);

        let exp = bsc.hashSync(salida);
    
        return exp;
      }


} 
module.exports = new ClaveSession();