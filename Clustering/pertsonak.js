const personas = [
      { nombre: "Ana", peso: 45, altura: 1.60 },
      { nombre: "Luis", peso: 70, altura: 1.75 },
      { nombre: "María", peso: 55, altura: 1.65 },
      { nombre: "Carlos", peso: 90, altura: 1.80 },
      { nombre: "Elena", peso: 100, altura: 1.70 },
      { nombre: "Tomás", peso: 60, altura: 1.60 },
      { nombre: "Lucía", peso: 48, altura: 1.55 },
      { nombre: "Jorge", peso: 85, altura: 1.75 },
      { nombre: "Sara", peso: 52, altura: 1.68 },
      { nombre: "Iván", peso: 110, altura: 1.85 }
    ];
    personas.forEach(persona => {
      const imc = persona.peso / (persona.altura * persona.altura);
      persona.imc = imc.toFixed(2);
    });
    console.log(personas);
    const cluster1 = {
        bajo: [],
        normal: [],
        alto: [],
        sobrepeso: [],
    };
    personas.forEach(persona => {
        if (persona.imc < 18.5) {
            cluster1.bajo.push(persona);
        } else if (persona.imc >= 18.5 && persona.imc < 25) {
            cluster1.normal.push(persona);
        } else if (persona.imc >= 25 && persona.imc < 30) {
            cluster1.sobrepeso.push(persona);
        } else {
            cluster1.alto.push(persona);
        }
    });
    console.log(cluster1);