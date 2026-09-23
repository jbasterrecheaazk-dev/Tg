// Dataset inicial (Datos de entrenamiento)
let datosEntrenamiento = [
  { color: "rojo", forma: "redonda", nombre: "Manzana" },
  { color: "amarillo", forma: "alargada", nombre: "Plátano" },
  { color: "naranja", forma: "redonda", nombre: "Naranja" },
  { color: "verde", forma: "alargada", nombre: "Calabacín" }
];

const boton = document.querySelector("#btn-preddecir");
boton.addEventListener("click", function() {
  let color = document.getElementById("input-color").value;
  console.log(color);
  let forma = document.getElementById("input-forma").value;
  console.log(forma);
});

for (let dato of datosEntrenamiento) {
  if (color === dato.color && forma === dato.forma) {
    console.log("La fruta es: " + dato.nombre);
  }
}    


// 2. ENTRENAR
 // btnGuardar.addEventListener("click", () => {
//    nuevaFruta = {
 //   color: inputColor.value,
//    forma: inputForma.value,
//    nombre: inputNombre.value
//  };

  //datosEntrenamiento.push(nuevaFruta);
  