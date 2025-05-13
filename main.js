import './style.css';

// Configuración de Firebase
const firebaseConfig = {
    apiKey: "AIzaSyA7irjSjANGeY4iZe80ZuOo_pr3aBhFi5s",
    authDomain: "rifa-smart-watch.firebaseapp.com",
    databaseURL: "https://rifa-smart-watch-default-rtdb.firebaseio.com",
    projectId: "rifa-smart-watch",
    storageBucket: "rifa-smart-watch.appspot.com",
    messagingSenderId: "916262944799",
    appId: "1:916262944799:web:8198492c24022ae398952a",
    measurementId: "G-YWMZ995XRK"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

class DonationApp {
    constructor() {
        this.participants = {};
        this.DONATION_AMOUNT = 50000;
        this.initializeApp();
        this.setupFirebaseListener();
        this.setupImageGallery();
    }

    setupImageGallery() {
        const images = document.querySelectorAll('.hero-image');
        let currentIndex = 0;

        setInterval(() => {
            images[currentIndex].classList.remove('active');
            currentIndex = (currentIndex + 1) % images.length;
            images[currentIndex].classList.add('active');
        }, 2000);
    }

    initializeApp() {
        this.renderProgress();
        this.renderParticipantsList();
        this.setupEventListeners();
    }

    setupFirebaseListener() {
        database.ref('donations').on('value', (snapshot) => {
            this.participants = snapshot.val() || {};
            this.renderProgress();
            this.renderParticipantsList();
        });
    }

    async updatePaymentStatus(numbers, status) {
        try {
            const updates = {};
            numbers.forEach(number => {
                updates[`donations/${number}/paymentStatus`] = status;
            });
            await database.ref().update(updates);
            return true;
        } catch (error) {
            console.error("Error actualizando estado de pago:", error);
            return false;
        }
    }

    calculateProgress() {
        const totalNumbers = 3000;
        const soldNumbers = Object.keys(this.participants).length;
        const percentage = (soldNumbers / totalNumbers) * 100;
        return {
            percentage: Math.round(percentage * 10) / 10
        };
    }

    calculateTotals() {
        const groupedParticipants = this.groupParticipantsByPerson();
        let totalPaid = 0;
        let totalPending = 0;

        Object.values(groupedParticipants).forEach(group => {
            if (group.paymentStatus === 'nequi' || group.paymentStatus === 'other') {
                totalPaid += this.DONATION_AMOUNT;
            } else {
                totalPending += this.DONATION_AMOUNT;
            }
        });

        return { totalPaid, totalPending };
    }

    renderProgress() {
        const progressContainer = document.getElementById('progressContainer');
        if (!progressContainer) return;

        const progress = this.calculateProgress();
        
        progressContainer.innerHTML = `
            <div class="progress-title">Progreso de la Rifa</div>
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${progress.percentage}%"></div>
                <div class="progress-text">${progress.percentage}% vendido</div>
            </div>
        `;
    }

    groupParticipantsByPerson() {
        const groups = {};
        const processed = new Set();

        const entries = Object.entries(this.participants)
            .sort((a, b) => a[1].timestamp - b[1].timestamp);

        for (let i = 0; i < entries.length; i++) {
            const [number, data] = entries[i];
            
            if (processed.has(number)) continue;

            const key = `${data.name}-${data.phone}-${data.email}-${data.timestamp}`;
            
            const nextEntry = entries[i + 1];
            if (nextEntry && 
                !processed.has(nextEntry[0]) && 
                nextEntry[1].name === data.name && 
                nextEntry[1].phone === data.phone && 
                nextEntry[1].email === data.email && 
                nextEntry[1].timestamp === data.timestamp) {
                
                groups[key] = {
                    name: data.name,
                    phone: data.phone,
                    email: data.email,
                    numbers: [number, nextEntry[0]],
                    paymentStatus: data.paymentStatus,
                    timestamp: data.timestamp
                };
                
                processed.add(number);
                processed.add(nextEntry[0]);
                i++;
            } else {
                groups[key] = {
                    name: data.name,
                    phone: data.phone,
                    email: data.email,
                    numbers: [number],
                    paymentStatus: data.paymentStatus,
                    timestamp: data.timestamp
                };
                processed.add(number);
            }
        }

        return groups;
    }

    renderParticipantsList() {
        const participantsList = document.getElementById('participantsList');
        if (!participantsList) return;

        participantsList.innerHTML = `
            <h2>Números Registrados</h2>
            <div class="sales-summary">
                <p>Números Vendidos: <span class="amount">${Object.keys(this.participants).length}</span></p>
            </div>
            <table class="participants-table">
                <thead>
                    <tr>
                        <th>Números</th>
                        <th>Nombre</th>
                    </tr>
                </thead>
                <tbody>
                    ${Object.values(this.groupParticipantsByPerson())
                        .sort((a, b) => a.timestamp - b.timestamp)
                        .map(data => {
                            const nameParts = data.name.split(' ');
                            const firstName = nameParts[0];
                            const secondNameInitial = nameParts[1] ? ` ${nameParts[1][0]}.` : '';
                            const displayName = firstName + secondNameInitial;
                            
                            return `
                                <tr>
                                    <td>${data.numbers.sort().join(', ')}</td>
                                    <td>${displayName}</td>
                                </tr>
                            `;
                        }).join('')}
                </tbody>
            </table>
        `;
    }

    generateUniqueNumbers() {
        const usedNumbers = new Set(Object.keys(this.participants));
        const numbers = [];
        
        while (numbers.length < 2) {
            const num = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
            if (!usedNumbers.has(num)) {
                numbers.push(num);
                usedNumbers.add(num);
            }
        }
        
        return numbers;
    }

    generateTicketImage(name, phone, numbers) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = 800;
        canvas.height = 400;
        
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.strokeStyle = '#2ecc71';
        ctx.lineWidth = 10;
        ctx.strokeRect(5, 5, canvas.width - 10, canvas.height - 10);
        
        ctx.fillStyle = '#2c3e50';
        ctx.textAlign = 'center';
        
        ctx.font = 'bold 40px Inter';
        ctx.fillText('Bono Donación Kiwo', canvas.width / 2, 80);
        
        ctx.font = '24px Inter';
        ctx.fillText(`Nombre: ${name}`, canvas.width / 2, 150);
        ctx.fillText(`Teléfono: ${phone}`, canvas.width / 2, 190);
        
        ctx.font = 'bold 36px Inter';
        ctx.fillStyle = '#27ae60';
        ctx.fillText('Números asignados:', canvas.width / 2, 250);
        ctx.font = 'bold 48px Inter';
        ctx.fillText(numbers.join(' - '), canvas.width / 2, 310);
        
        ctx.font = '20px Inter';
        ctx.fillStyle = '#2c3e50';
        ctx.fillText('Sorteo: Sábado 24 de agosto - Lotería de Boyacá', canvas.width / 2, 370);
        
        return canvas.toDataURL('image/png');
    }

    downloadTicket(dataUrl, name) {
        const link = document.createElement('a');
        link.download = `bono-donacion-${name.toLowerCase().replace(/\s+/g, '-')}.png`;
        link.href = dataUrl;
        link.click();
    }

    async saveParticipant(name, phone, email, numbers) {
        try {
            const timestamp = Date.now();
            const updates = {};
            numbers.forEach(number => {
                updates[`donations/${number}`] = {
                    name,
                    phone,
                    email,
                    timestamp,
                    paymentStatus: 'pending'
                };
            });

            await database.ref().update(updates);
            return true;
        } catch (error) {
            console.error("Error guardando participante:", error);
            return false;
        }
    }

    setupEventListeners() {
        const buyButtons = document.querySelectorAll('#buyButton, .buyButton');
        const registrationModal = document.getElementById('registrationModal');
        const successModal = document.getElementById('successModal');
        const registrationForm = document.getElementById('registrationForm');

        buyButtons.forEach(button => {
            button.addEventListener('click', () => {
                registrationModal.classList.add('active');
            });
        });

        if (registrationForm) {
            registrationForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const name = document.getElementById('name').value;
                const phone = document.getElementById('phone').value;
                const email = document.getElementById('email').value;

                const numbers = this.generateUniqueNumbers();
                const success = await this.saveParticipant(name, phone, email, numbers);

                if (success) {
                    registrationModal.classList.remove('active');
                    const assignedNumbers = document.getElementById('assignedNumbers');
                    assignedNumbers.innerHTML = numbers.map(n => `<span>${n}</span>`).join('');
                    successModal.classList.add('active');
                    
                    const ticketImage = this.generateTicketImage(name, phone, numbers);
                    this.downloadTicket(ticketImage, name);
                    
                    registrationForm.reset();
                } else {
                    alert('Error al procesar la donación. Por favor intente nuevamente.');
                }
            });
        }

        window.closeSuccessModal = () => {
            successModal.classList.remove('active');
        };

        [registrationModal, successModal].forEach(modal => {
            if (modal) {
                modal.addEventListener('click', (e) => {
                    if (e.target === modal) {
                        modal.classList.remove('active');
                    }
                });
            }
        });
    }
}

// Inicializar la aplicación
new DonationApp();