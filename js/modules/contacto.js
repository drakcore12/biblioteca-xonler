// Módulo para la página de contacto
export default function initContactoPage() {
  console.log('Página de contacto inicializada');
  
  // Manejar envío del formulario de contacto
  initContactForm();
}

// Función para manejar el formulario de contacto
function initContactForm() {
  const contactForm = document.getElementById('contactForm');
  if (!contactForm) return;
  
  contactForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Recoger datos del formulario
    const nombre = document.getElementById('nombre').value;
    const email = document.getElementById('email').value;
    const asunto = document.getElementById('asunto').value;
    const mensaje = document.getElementById('mensaje').value;
    
    console.log('Enviando formulario de contacto:', {
      nombre,
      email,
      asunto,
      mensaje
    });
    
    // Aquí se enviaría el formulario al servidor
    // Por ahora mostramos un mensaje de éxito
    alert('Mensaje enviado correctamente. Gracias por contactarnos.');
    
    // Limpiar el formulario
    contactForm.reset();
  });
}