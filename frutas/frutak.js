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
  for (let dato of datosEntrenamiento) {
  console.log(dato.color + " " + dato.forma + " " + dato.nombre + " " + color + " " + forma);
  if (color === dato.color && forma === dato.forma) {
    console.log("La fruta es: " + dato.nombre);
    let resultadoDiv = document.getElementById("resultado");
    resultadoDiv.textContent = "La fruta es: " + dato.nombre;
    document.getElementById("seccion-resultado").classList.remove("hidden");
    break;
    }
  }
});

const volver = document.querySelector("#btn-reiniciar");
volver.addEventListener("click", function() {
  document.getElementById("seccion-resultado").classList.add("hidden");
  document.getElementById("input-color").value = "";
  document.getElementById("input-forma").value = "";
});

// 2. ENTRENAR
 // btnGuardar.addEventListener("click", () => {
//    nuevaFruta = {
 //   color: inputColor.value,
//    forma: inputForma.value,
//    nombre: inputNombre.value
//  };

  //datosEntrenamiento.push(nuevaFruta);
  