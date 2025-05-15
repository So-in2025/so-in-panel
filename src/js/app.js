// app.js: módulo principal con todo el código integrado
import { sanitize, showSnackbar, exportToCSV } from './utils.js';
import { auth, db } from './firebase.js';



    // Función global para mostrar notificación flotante tipo snackbar
    window.mostrarSnackbar = function (mensaje, color = "#ff3c3c") {
      const snackbar = document.getElementById("snackbar");
      snackbar.innerText = mensaje;
      snackbar.style.backgroundColor = color;
      snackbar.style.visibility = "visible";
      snackbar.style.opacity = "1";
      snackbar.style.transform = "translateY(0)";

    setTimeout(() => {
      snackbar.style.opacity = "0";
      snackbar.style.transform = "translateY(20px)";
    setTimeout(() => {
      snackbar.style.visibility = "hidden";
      }, 300);
    }, 3500);
  }
    // Importamos SDK de Firebase desde sus módulos CDN
    import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
    import { getFirestore, collection, onSnapshot } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";
    import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";

    // 🔧 CONFIGURACIÓN DE TU PROYECTO FIREBASE 🔧
        const firebaseConfig = {
            apiKey: "AIzaSyA6oVAHQ26a47vkohSz1ki6-ww5uBB0NLM",
            authDomain: "chat-so-in.firebaseapp.com",
            projectId: "chat-so-in",
            storageBucket: "chat-so-in.firebasestorage.app",
            messagingSenderId: "507524033572",
            appId: "1:507524033572:web:6279f6c7980042a8317cb1",
            measurementId: "G-350577PRDY"
            };

      // Inicializamos Firebase
      const app = initializeApp(firebaseConfig);
      const db = getFirestore(app);
      const auth = getAuth(app);

    // UID autorizado (debe coincidir con tu admin en Firebase Auth)
    const ADMIN_UIDS = [
        "rIptuTP8xtd6fylyXzrSv4TGaE53",
        "Mpk35mPS7BPFJ06Si4HBRnXz61l2",
        "gfqsRb03dbSVBBuaexg3lmYf2Rh1" // Jhonny hard
    ];
    // Escuchar el estado de autenticación
    onAuthStateChanged(auth, (user) => {
        if (user && ADMIN_UIDS.includes(user.uid)) {
          console.log("✅ Acceso autorizado - Bienvenido Admin");
          cargarDatos();
          actualizarResumen();
          cargarExpedientes(); 
        } else {
          alert("Acceso restringido. Solo administradores.");
          window.location.href = "/";
        }
      });

    // FUNCIONES PARA CARGAR DATOS DINÁMICOS
    function cargarDatos() {
      cargarItinerario();
      cargarMensajes();
      cargarRegistros();
    }
    
    let dataItinerarioCompleta = [];

    function exportarItinerarioExcel() {
      let csv = "Cliente,Servicio,Fecha,Estado\n";
      dataItinerarioCompleta.forEach((item) => {
        csv += `"${item.nombre}","${item.servicio}","${item.fecha}","${item.estado}"\n`;
      });

      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "itinerario.csv";
      a.click();
      URL.revokeObjectURL(url);
      mostrarSnackbar("📁 Exportación realizada con éxito", "#6c63ff");
    }
      
    // 🔄 Cargar Itinerario en tiempo real desde Firestore (versión final unificada)
    function cargarItinerario() {
      const ref = collection(db, "itinerarios");
      const contenedor = document.getElementById("bloque-itinerario");
      contenedor.innerHTML = "<p style='color:#999;'>Cargando servicios...</p>";

      onSnapshot(ref, (snapshot) => {
        dataItinerarioCompleta = [];
        contenedor.innerHTML = "";

        if (snapshot.empty) {
          contenedor.innerHTML = "<p style='color:#ccc;'>No hay servicios registrados.</p>";
          return;
        }

        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          data.id = docSnap.id;
          dataItinerarioCompleta.push(data);
        });

        renderizarItinerarioFiltrado();
      });

      // Escuchar filtros
      document.getElementById("busqueda-itinerario").addEventListener("input", renderizarItinerarioFiltrado);
      document.getElementById("filtro-estado-itinerario").addEventListener("change", renderizarItinerarioFiltrado);
    }
    
    function renderizarItinerarioFiltrado() {
      const contenedor = document.getElementById("itinerario-lista");
      const texto = document.getElementById("busqueda-itinerario").value.toLowerCase();
      const estadoFiltro = document.getElementById("filtro-estado-itinerario").value;

      contenedor.innerHTML = "";

      const filtrados = dataItinerarioCompleta.filter((item) => {
        const coincideTexto =
          (item.nombre || "").toLowerCase().includes(texto) ||
          (item.servicio || "").toLowerCase().includes(texto);
        const coincideEstado = estadoFiltro === "todos" || item.estado === estadoFiltro;
        return coincideTexto && coincideEstado;
      });

      if (filtrados.length === 0) {
        contenedor.innerHTML = "<p style='color:#999;'>No hay coincidencias.</p>";
        return;
      }

      filtrados.forEach((data) => {
        const color = data.estado === "Completado" ? "#4caf50"
                    : data.estado === "Cancelado" ? "#f44336"
                    : "#ff9800";

        const card = document.createElement("div");
        card.style.background = "#2a2a2a";
        card.style.padding = "12px";
        card.style.marginBottom = "10px";
        card.style.borderRadius = "10px";
        card.style.borderLeft = `4px solid ${color}`;

        card.innerHTML = `
          <strong style="color: ${color};">${data.servicio || "Servicio sin nombre"}</strong><br>
          <span style="color: #ccc;">Cliente: ${data.nombre || "No indicado"}</span><br>
          <span style="color: #999;">Fecha: ${data.fecha || "Sin fecha"}</span><br>
          <span style="color: ${color}; font-weight: bold;">Estado: ${data.estado || "Pendiente"}</span><br><br>
          <div style="display: flex; gap: 8px; flex-wrap: wrap;">
            <button onclick="actualizarEstado('${data.id}', 'Pendiente')" style="padding:6px 10px;border:none;border-radius:6px;background:#ff9800;color:white;cursor:pointer;">Pendiente</button>
            <button onclick="actualizarEstado('${data.id}', 'Completado')" style="padding:6px 10px;border:none;border-radius:6px;background:#4caf50;color:white;cursor:pointer;">Completado</button>
            <button onclick="actualizarEstado('${data.id}', 'Cancelado')" style="padding:6px 10px;border:none;border-radius:6px;background:#f44336;color:white;cursor:pointer;">Cancelado</button>
          </div>
        `;
        contenedor.appendChild(card);
      });
    }

        function cargarExpedientes() {
          const expedientes = {};

          const mensajesRef = collection(db, "mensajes");
          const serviciosRef = collection(db, "itinerario");

          // 1. Obtener todos los mensajes
          getDocs(mensajesRef).then((mensajesSnap) => {
            mensajesSnap.forEach((doc) => {
              const data = doc.data();
              const nombre = data.nombre?.trim().toLowerCase() || "anónimo";
              if (!expedientes[nombre]) expedientes[nombre] = { mensajes: [], servicios: [] };
              expedientes[nombre].mensajes.push(data);
            });

            // 2. Obtener todos los servicios
            getDocs(serviciosRef).then((serviciosSnap) => {
              serviciosSnap.forEach((doc) => {
                const data = doc.data();
                const nombre = data.nombre?.trim().toLowerCase() || "anónimo";
                if (!expedientes[nombre]) expedientes[nombre] = { mensajes: [], servicios: [] };
                expedientes[nombre].servicios.push(data);
              });

              renderizarExpedientes(expedientes);
            });
          });
        }

        function renderizarExpedientes(data) {
          const contenedor = document.getElementById("expedientes-lista");
          contenedor.innerHTML = "";

          const nombres = Object.keys(data);
          if (nombres.length === 0) {
            contenedor.innerHTML = "<p style='color:#999;'>Sin registros aún.</p>";
            return;
          }

          nombres.forEach((nombre) => {
            const exp = data[nombre];
            const box = document.createElement("div");
            box.style.background = "#222";
            box.style.padding = "15px";
            box.style.marginBottom = "15px";
            box.style.borderRadius = "10px";
            box.style.borderLeft = "4px solid #6c63ff";

            box.innerHTML = `
              <h3 style="color:#6c63ff;">🧑 ${nombre.toUpperCase()}</h3>
              <p style="color:#ccc;">📬 Mensajes: ${exp.mensajes.length} | 📋 Servicios: ${exp.servicios.length}</p>

              <div style="margin-top:10px;">
                ${exp.mensajes.map(m => `
                  <div style="margin-bottom:10px; border-left: 3px solid #4caf50; padding-left: 8px;">
                    <strong style="color:#4caf50;">Mensaje:</strong> ${m.mensaje}<br>
                    <small style="color:#888;">Fecha: ${m.fecha || "Desconocida"}</small><br>
                    ${m.respuesta ? `<strong style="color:#ff3c3c;">Respuesta:</strong> ${m.respuesta}` : ""}
                  </div>
                `).join("")}

                ${exp.servicios.map(s => `
                  <div style="margin-bottom:10px; border-left: 3px solid #ff9800; padding-left: 8px;">
                    <strong style="color:#ff9800;">Servicio:</strong> ${s.servicio}<br>
                    <small style="color:#888;">Fecha: ${s.fecha || "Sin fecha"} | Estado: ${s.estado}</small>
                  </div>
                `).join("")}
              </div>
            `;

            contenedor.appendChild(box);
          });
        }
          function actualizarResumen() {
              actualizarResumenMensajes();
              actualizarResumenItinerario();
              actualizarResumenRegistros();
            }

            // 🔄 RESUMEN DE MENSAJES
            function actualizarResumenMensajes() {
              const ref = collection(db, "mensajes");
              onSnapshot(ref, (snapshot) => {
                const total = snapshot.size;
                let atendidos = 0;
                snapshot.forEach(doc => {
                  if (doc.data().atendido) atendidos++;
                });

                const pendientes = total - atendidos;
                const div = document.getElementById("info-mensajes");
                div.innerHTML = `
                  <h3 style="color: #6c63ff;">📬 Mensajes</h3>
                  <p>Total: ${total}</p>
                  <p style="color:#4caf50;">Atendidos: ${atendidos}</p>
                  <p style="color:#ff9800;">Pendientes: ${pendientes}</p>
                `;
              });
            }

            // 🔄 RESUMEN DE ITINERARIO
            function actualizarResumenItinerario() {
              const ref = collection(db, "itinerario");
              onSnapshot(ref, (snapshot) => {
                const total = snapshot.size;
                let completados = 0, pendientes = 0, cancelados = 0;

                snapshot.forEach(doc => {
                  const estado = doc.data().estado;
                  if (estado === "Completado") completados++;
                  else if (estado === "Pendiente") pendientes++;
                  else if (estado === "Cancelado") cancelados++;
                });

                const div = document.getElementById("info-itinerario");
                div.innerHTML = `
                  <h3 style="color: #6c63ff;">📋 Servicios</h3>
                  <p>Total: ${total}</p>
                  <p style="color:#4caf50;">Completados: ${completados}</p>
                  <p style="color:#ff9800;">Pendientes: ${pendientes}</p>
                  <p style="color:#f44336;">Cancelados: ${cancelados}</p>
                `;
              });
            }

            // 🔄 RESUMEN DE REGISTROS
            function actualizarResumenRegistros() {
              const ref = collection(db, "registro");
              onSnapshot(ref, (snapshot) => {
                const total = snapshot.size;
                const div = document.getElementById("info-registros");
                div.innerHTML = `
                  <h3 style="color: #6c63ff;">🧾 Registros</h3>
                  <p>Clientes registrados: ${total}</p>
                `;
              });
            }

    // ✅ Función para actualizar estado
    window.actualizarEstado = async function(id, nuevoEstado) {
      try {
        const ref = doc(db, "itinerarios", id);
        await updateDoc(ref, { estado: nuevoEstado });
        mostrarSnackbar(`🛠️ Estado cambiado a ${nuevoEstado}`, "#2196f3");
      } catch (e) {
        console.error("Error al actualizar estado:", e);
      }
    }
    // 🔄 Cargar Mensajes del Chat en Tiempo Real con notificación
    let dataMensajesCompleta = [];

    function cargarMensajes() {
      const ref = collection(db, "mensajes");
      const contenedor = document.getElementById("mensajes-lista");
      const audio = document.getElementById("notif-audio");
      const badge = document.getElementById("contador-mensajes");

      contenedor.innerHTML = "<p style='color:#999;'>Cargando mensajes...</p>";

      onSnapshot(ref, (snapshot) => {
        dataMensajesCompleta = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          data.id = docSnap.id;
          dataMensajesCompleta.push(data);
        });

        renderizarMensajesFiltrados();

        function exportarMensajesExcel() {
          let csv = "Nombre,Mensaje,Fecha,Estado\n";
          dataMensajesCompleta.forEach((item) => {
          csv += `"${item.nombre}","${item.mensaje}","${item.fecha}","${item.atendido ? 'Atendido' : 'No atendido'}"\n`;
        });

            const blob = new Blob([csv], { type: "text/csv" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "mensajes.csv";
            a.click();
            URL.revokeObjectURL(url);

            mostrarSnackbar("📁 Exportación realizada con éxito", "#6c63ff");
            }

        const noAtendidos = dataMensajesCompleta.filter(msg => !msg.atendido).map(msg => msg.id);
        if (mensajesPrevios.length > 0 && noAtendidos.length > mensajesPrevios.length) {
          audio.play();
        }

        badge.innerText = `${noAtendidos.length} nuevos`;
        badge.style.display = noAtendidos.length > 0 ? 'inline-block' : 'none';

        mensajesPrevios = noAtendidos;
      });

      document.getElementById("busqueda-mensajes").addEventListener("input", renderizarMensajesFiltrados);
      document.getElementById("filtro-estado-mensajes").addEventListener("change", renderizarMensajesFiltrados);
    }

    function renderizarMensajesFiltrados() {
      const contenedor = document.getElementById("mensajes-lista");
      const texto = document.getElementById("busqueda-mensajes").value.toLowerCase();
      const estado = document.getElementById("filtro-estado-mensajes").value;

      contenedor.innerHTML = "";

      const filtrados = dataMensajesCompleta.filter((msg) => {
        const coincideTexto =
          (msg.nombre || "").toLowerCase().includes(texto) ||
          (msg.mensaje || "").toLowerCase().includes(texto);
        const coincideEstado =
          estado === "todos" ||
          (estado === "atendidos" && msg.atendido) ||
          (estado === "noAtendidos" && !msg.atendido);
        return coincideTexto && coincideEstado;
      });

      if (filtrados.length === 0) {
        contenedor.innerHTML = "<p style='color:#999;'>No se encontraron mensajes.</p>";
        return;
      }

      filtrados.forEach((data) => {
        const mensaje = document.createElement("div");
        const estaAtendido = data.atendido === true;

        mensaje.style.background = estaAtendido ? "#1a1a1a" : "#222";
        mensaje.style.padding = "10px";
        mensaje.style.marginBottom = "10px";
        mensaje.style.borderLeft = estaAtendido ? "4px solid #4caf50" : "4px solid #ff3c3c";
        mensaje.style.borderRadius = "8px";

        mensaje.innerHTML = `
            <strong style="color: ${estaAtendido ? "#4caf50" : "#ff3c3c"};">${data.nombre || "Anónimo"}</strong><br>
            <span style="color: #ccc;">${data.mensaje || "Mensaje vacío"}</span><br>
            <small style="color: #888;">${data.fecha || "Fecha desconocida"}</small><br>
            ${!estaAtendido
              ? `<button onclick="marcarAtendido('${data.id}')" style="margin-top:6px;padding:6px 10px;background:#ff3c3c;color:#fff;border:none;border-radius:6px;cursor:pointer;">Marcar como atendido</button>`
              : `<small style="color:#4caf50;">✔ Atendido</small>`
            }

            <div style="margin-top: 10px;">
              <label style="color: #ccc;">Respuesta:</label><br>
              <textarea id="respuesta-${data.id}" placeholder="Escribí tu respuesta..." rows="2" style="width: 100%; padding: 8px; border-radius: 6px; border: none; background: #111; color: white;">${data.respuesta || ""}</textarea>
              <button onclick="guardarRespuesta('${data.id}')" style="margin-top: 6px; padding: 6px 10px; background: #6c63ff; color: white; border: none; border-radius: 6px; cursor: pointer;">💬 Enviar respuesta</button>
            </div>
          `;

        contenedor.appendChild(mensaje);
      });
    }

    // ✅ FUNCIÓN PARA ACTUALIZAR ESTADO A "ATENDIDO"
    window.marcarAtendido = async function(id) {
      window.guardarRespuesta = async function(id) {
        try {
          const textarea = document.getElementById(`respuesta-${id}`);
          const texto = textarea.value.trim();

          if (!texto) {
            mostrarSnackbar("✏️ No se puede guardar una respuesta vacía", "#ffa726");
            return;
          }

          const ref = doc(db, "mensajes", id);
          await updateDoc(ref, { respuesta: texto });

          mostrarSnackbar("💬 Respuesta guardada correctamente", "#6c63ff");
        } catch (e) {
          console.error("Error al guardar respuesta:", e);
          mostrarSnackbar("❌ Error al guardar la respuesta", "#f44336");
        }
      }
      try {
        const mensajeRef = doc(db, "mensajes", id);
        await updateDoc(mensajeRef, { atendido: true });
        mostrarSnackbar("✅ Mensaje marcado como atendido", "#4caf50");
      } catch (err) {
        console.error("Error al actualizar mensaje:", err);
      }
    }


    // 🔄 Cargar Registro de Clientes en Tiempo Real
    function cargarRegistros() {
      const ref = collection(db, "registro");
      const contenedor = document.getElementById("registro-lista");
      contenedor.innerHTML = "<p style='color:#999;'>Cargando registros...</p>";

      onSnapshot(ref, (snapshot) => {
        if (snapshot.empty) {
          contenedor.innerHTML = "<p style='color:#999;'>Sin registros por ahora.</p>";
          return;
        }

        contenedor.innerHTML = "";
        snapshot.forEach((doc) => {
          const data = doc.data();
          const registro = document.createElement("div");
          registro.style.background = "#222";
          registro.style.padding = "12px";
          registro.style.marginBottom = "10px";
          registro.style.borderRadius = "8px";
          registro.style.borderLeft = "4px solid #ff3c3c";

          registro.innerHTML = `
            <strong style="color: #ff3c3c;">${data.nombre || "Sin nombre"}</strong><br>
            <span style="color: #ccc;">Servicio: ${data.servicio || "No especificado"}</span><br>
            <span style="color: #ccc;">Contacto: ${data.contacto || "Sin datos"}</span><br>
            <small style="color: #888;">Fecha: ${data.fecha || "Sin fecha"}</small>
          `;

          contenedor.appendChild(registro);
        });
      });
    }

  
