document.addEventListener('DOMContentLoaded', function() {
  const token = localStorage.getItem('auth_token');
  
  // Si no hay token, redireccionar a login
  if (!token) {
    window.location.href = '/login';
    return;
  }
  
  // Elementos DOM
  const activeAccountsList = document.getElementById('active-accounts-list');
  const inactiveAccountsList = document.getElementById('inactive-accounts-list');
  const activeAccountsLoading = document.getElementById('active-accounts-loading');
  const inactiveAccountsLoading = document.getElementById('inactive-accounts-loading');
  const activeAccountsContent = document.getElementById('active-accounts-content');
  const inactiveAccountsContent = document.getElementById('inactive-accounts-content');
  const noActiveAccounts = document.getElementById('no-active-accounts');
  const noInactiveAccounts = document.getElementById('no-inactive-accounts');
  const totalBalanceElement = document.getElementById('totalBalance');
  
  // Modales
  const addAccountModal = new bootstrap.Modal(document.getElementById('addAccountModal'));
  const editAccountModal = new bootstrap.Modal(document.getElementById('editAccountModal'));
  const deleteAccountModal = new bootstrap.Modal(document.getElementById('deleteAccountModal'));
  
  // Botones de acción
  const saveAccountBtn = document.getElementById('saveAccountBtn');
  const updateAccountBtn = document.getElementById('updateAccountBtn');
  const deleteAccountBtn = document.getElementById('deleteAccountBtn');
  const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
  
  // Estado de la aplicación
  let accounts = [];
  let currentAccountId = null;
  let selectedCurrency = 'EUR';
  
  // Formateo de moneda
  const formatCurrency = (amount, currency = 'EUR') => {
    const currencyMap = {
      'EUR': { locale: 'es-ES', currency: 'EUR', symbol: '€' },
      'USD': { locale: 'en-US', currency: 'USD', symbol: '$' },
      'GBP': { locale: 'en-GB', currency: 'GBP', symbol: '£' }
    };
    
    const { locale, currency: curr } = currencyMap[currency] || currencyMap['EUR'];
    
    return new Intl.NumberFormat(locale, { 
      style: 'currency', 
      currency: curr 
    }).format(amount);
  };
  
  // Cargar las cuentas del usuario
  const loadAccounts = async () => {
    try {
      activeAccountsLoading.classList.remove('d-none');
      inactiveAccountsLoading.classList.remove('d-none');
      
      const response = await fetch('/api/accounts', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Error al cargar las cuentas');
      }
      
      const data = await response.json();
      accounts = data.accounts;
      
      // Filtrar cuentas activas e inactivas
      const activeAccounts = accounts.filter(account => account.isActive);
      const inactiveAccounts = accounts.filter(account => !account.isActive);
      
      // Mostrar/ocultar elementos según corresponda
      activeAccountsLoading.classList.add('d-none');
      inactiveAccountsLoading.classList.add('d-none');
      
      if (activeAccounts.length === 0) {
        noActiveAccounts.classList.remove('d-none');
      } else {
        activeAccountsContent.classList.remove('d-none');
        renderAccounts(activeAccounts, activeAccountsList);
      }
      
      if (inactiveAccounts.length === 0) {
        noInactiveAccounts.classList.remove('d-none');
      } else {
        inactiveAccountsContent.classList.remove('d-none');
        renderAccounts(inactiveAccounts, inactiveAccountsList);
      }
      
      // Calcular y mostrar el balance total
      updateTotalBalance();
      
    } catch (error) {
      console.error('Error:', error);
      activeAccountsLoading.classList.add('d-none');
      inactiveAccountsLoading.classList.add('d-none');
      
      // Mostrar mensaje de error
      activeAccountsList.innerHTML = `
        <div class="col-12">
          <div class="alert alert-danger">
            Error al cargar las cuentas. Por favor, intenta de nuevo más tarde.
          </div>
        </div>
      `;
      inactiveAccountsList.innerHTML = '';
    }
  };
  
  // Renderizar las cuentas en el DOM
  const renderAccounts = (accounts, container) => {
    container.innerHTML = '';
    
    accounts.forEach(account => {
      const accountCard = document.createElement('div');
      accountCard.className = 'col-md-4 mb-4';
      
      // Determinar el icono según el tipo de cuenta
      const icon = account.icon || getDefaultIcon(account.type);
      
      // Crear la tarjeta de cuenta
      accountCard.innerHTML = `
        <div class="card h-100 account-card" data-account-id="${account.id}" style="border-left: 5px solid ${account.color || '#3498db'};">
          <div class="card-body">
            <div class="d-flex justify-content-between align-items-center mb-2">
              <h5 class="card-title mb-0">
                <i class="bi ${icon} me-2"></i>${account.name}
              </h5>
              <button class="btn btn-sm btn-outline-primary edit-account-btn">
                <i class="bi bi-pencil"></i>
              </button>
            </div>
            <p class="card-text text-muted small">
              ${account.institution ? account.institution : ''} 
              ${account.accountNumber ? '•••• ' + account.accountNumber.slice(-4) : ''}
            </p>
            <div class="d-flex justify-content-between align-items-end">
              <span class="account-type-badge badge ${getAccountTypeBadgeClass(account.type)}">
                ${getAccountTypeLabel(account.type)}
              </span>
              <h4 class="mb-0">${formatCurrency(account.balance, account.currency)}</h4>
            </div>
          </div>
        </div>
      `;
      
      container.appendChild(accountCard);
      
      // Agregar el manejador de eventos para editar
      const editBtn = accountCard.querySelector('.edit-account-btn');
      editBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        openEditAccountModal(account.id);
      });
      
      // Hacer que toda la tarjeta sea clickeable para ver detalles
      const card = accountCard.querySelector('.account-card');
      card.addEventListener('click', () => {
        window.location.href = `/accounts/${account.id}`;
      });
    });
  };
  
  // Obtener el icono predeterminado según el tipo de cuenta
  const getDefaultIcon = (type) => {
    const icons = {
      'checking': 'bi-credit-card',
      'savings': 'bi-piggy-bank',
      'credit': 'bi-credit-card-2-front',
      'investment': 'bi-graph-up-arrow',
      'cash': 'bi-cash-coin',
      'other': 'bi-bank'
    };
    
    return icons[type] || 'bi-bank';
  };
  
  // Obtener la clase de badge según el tipo de cuenta
  const getAccountTypeBadgeClass = (type) => {
    const classes = {
      'checking': 'bg-primary',
      'savings': 'bg-success',
      'credit': 'bg-danger',
      'investment': 'bg-warning',
      'cash': 'bg-info',
      'other': 'bg-secondary'
    };
    
    return classes[type] || 'bg-secondary';
  };
  
  // Obtener la etiqueta según el tipo de cuenta
  const getAccountTypeLabel = (type) => {
    const labels = {
      'checking': 'Cuenta Corriente',
      'savings': 'Ahorro',
      'credit': 'Crédito',
      'investment': 'Inversión',
      'cash': 'Efectivo',
      'other': 'Otra'
    };
    
    return labels[type] || 'Otra';
  };
  
  // Actualizar el balance total
  const updateTotalBalance = async () => {
    try {
      // Calcular el balance total en la moneda seleccionada
      let totalBalance = 0;
      
      for (const account of accounts) {
        if (account.isActive) {
          if (account.currency === selectedCurrency) {
            totalBalance += parseFloat(account.balance);
          } else {
            // Aquí se podría implementar la conversión de moneda
            // Por ahora, simplemente sumamos el valor tal cual
            // En una implementación real, esto llamaría a un servicio de conversión
            totalBalance += parseFloat(account.balance);
          }
        }
      }
      
      totalBalanceElement.textContent = formatCurrency(totalBalance, selectedCurrency);
    } catch (error) {
      console.error('Error al calcular el balance total:', error);
    }
  };

  // Abrir el modal de edición de cuenta
  const openEditAccountModal = (accountId) => {
    currentAccountId = accountId;
    const account = accounts.find(acc => acc.id === accountId);
    
    if (!account) {
      return;
    }
    
    // Llenar el formulario con los datos de la cuenta
    document.getElementById('edit-account-id').value = account.id;
    document.getElementById('edit-account-name').value = account.name;
    document.getElementById('edit-account-type').value = account.type;
    document.getElementById('edit-account-institution').value = account.institution || '';
    document.getElementById('edit-account-number').value = account.accountNumber || '';
    document.getElementById('edit-account-balance').value = account.balance;
    document.getElementById('edit-account-currency').value = account.currency;
    document.getElementById('edit-account-color').value = account.color || '#3498db';
    document.getElementById('edit-account-icon').value = account.icon || getDefaultIcon(account.type);
    document.getElementById('edit-account-active').checked = account.isActive;
    document.getElementById('edit-account-notes').value = account.notes || '';
    
    // Actualizar símbolo de moneda
    document.getElementById('edit-currency-symbol').textContent = 
      account.currency === 'USD' ? '$' : account.currency === 'GBP' ? '£' : '€';
    
    // Mostrar el modal
    editAccountModal.show();
  };
  
  // Guardar una nueva cuenta
  const saveAccount = async () => {
    try {
      const formData = {
        name: document.getElementById('account-name').value,
        type: document.getElementById('account-type').value,
        institution: document.getElementById('account-institution').value || null,
        accountNumber: document.getElementById('account-number').value || null,
        balance: parseFloat(document.getElementById('account-balance').value),
        currency: document.getElementById('account-currency').value,
        color: document.getElementById('account-color').value,
        icon: document.getElementById('account-icon').value,
        notes: document.getElementById('account-notes').value || null
      };
      
      const response = await fetch('/api/accounts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      
      if (!response.ok) {
        throw new Error('Error al crear la cuenta');
      }
      
      // Cerrar el modal y recargar las cuentas
      addAccountModal.hide();
      document.getElementById('addAccountForm').reset();
      
      // Mostrar mensaje de éxito
      showAlert('Cuenta creada con éxito', 'success');
      
      // Recargar las cuentas
      loadAccounts();
    } catch (error) {
      console.error('Error:', error);
      showAlert('Error al crear la cuenta. Por favor, intenta de nuevo.', 'danger');
    }
  };
  
  // Actualizar una cuenta existente
  const updateAccount = async () => {
    if (!currentAccountId) return;
    
    try {
      const formData = {
        name: document.getElementById('edit-account-name').value,
        type: document.getElementById('edit-account-type').value,
        institution: document.getElementById('edit-account-institution').value || null,
        accountNumber: document.getElementById('edit-account-number').value || null,
        balance: parseFloat(document.getElementById('edit-account-balance').value),
        currency: document.getElementById('edit-account-currency').value,
        color: document.getElementById('edit-account-color').value,
        icon: document.getElementById('edit-account-icon').value,
        isActive: document.getElementById('edit-account-active').checked,
        notes: document.getElementById('edit-account-notes').value || null
      };
      
      const response = await fetch(`/api/accounts/${currentAccountId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      
      if (!response.ok) {
        throw new Error('Error al actualizar la cuenta');
      }
      
      // Cerrar el modal y recargar las cuentas
      editAccountModal.hide();
      
      // Mostrar mensaje de éxito
      showAlert('Cuenta actualizada con éxito', 'success');
      
      // Recargar las cuentas
      loadAccounts();
    } catch (error) {
      console.error('Error:', error);
      showAlert('Error al actualizar la cuenta. Por favor, intenta de nuevo.', 'danger');
    }
  };
  
  // Confirmar eliminación de cuenta
  const confirmDelete = () => {
    if (!currentAccountId) return;
    
    // Ocultar modal de edición y mostrar el de confirmación
    editAccountModal.hide();
    deleteAccountModal.show();
  };
  
  // Eliminar cuenta
  const deleteAccount = async () => {
    if (!currentAccountId) return;
    
    try {
      const response = await fetch(`/api/accounts/${currentAccountId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Error al eliminar la cuenta');
      }
      
      // Cerrar el modal y recargar las cuentas
      deleteAccountModal.hide();
      
      // Mostrar mensaje de éxito
      showAlert('Cuenta eliminada con éxito', 'success');
      
      // Recargar las cuentas
      loadAccounts();
    } catch (error) {
      console.error('Error:', error);
      showAlert('Error al eliminar la cuenta. Por favor, intenta de nuevo.', 'danger');
    }
  };
  
  // Mostrar alerta
  const showAlert = (message, type = 'info') => {
    const alertContainer = document.createElement('div');
    alertContainer.className = 'alert-container';
    alertContainer.style.position = 'fixed';
    alertContainer.style.top = '20px';
    alertContainer.style.right = '20px';
    alertContainer.style.zIndex = '9999';
    
    const alert = document.createElement('div');
    alert.className = `alert alert-${type} alert-dismissible fade show`;
    alert.innerHTML = `
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Cerrar"></button>
    `;
    
    alertContainer.appendChild(alert);
    document.body.appendChild(alertContainer);
    
    // Eliminar la alerta después de 5 segundos
    setTimeout(() => {
      const bsAlert = new bootstrap.Alert(alert);
      bsAlert.close();
      setTimeout(() => alertContainer.remove(), 500);
    }, 5000);
  };
  
  // Manejadores de eventos para el cambio de moneda
  document.querySelectorAll('#currencySelector .dropdown-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      
      // Actualizar la moneda seleccionada
      selectedCurrency = e.target.dataset.currency;
      document.getElementById('currencyDropdown').textContent = selectedCurrency;
      
      // Actualizar clases de los elementos del menú
      document.querySelectorAll('#currencySelector .dropdown-item').forEach(el => {
        el.classList.remove('active');
      });
      e.target.classList.add('active');
      
      // Actualizar el balance total
      updateTotalBalance();
    });
  });
  
  // Manejadores de eventos para los botones de acción
  saveAccountBtn.addEventListener('click', saveAccount);
  updateAccountBtn.addEventListener('click', updateAccount);
  deleteAccountBtn.addEventListener('click', confirmDelete);
  confirmDeleteBtn.addEventListener('click', deleteAccount);
  
  // Cambio de moneda en el formulario de edición
  document.getElementById('edit-account-currency').addEventListener('change', (e) => {
    const currency = e.target.value;
    document.getElementById('edit-currency-symbol').textContent = 
      currency === 'USD' ? '$' : currency === 'GBP' ? '£' : '€';
  });
  
  // Cambio de moneda en el formulario de creación
  document.getElementById('account-currency').addEventListener('change', (e) => {
    const currency = e.target.value;
    const balanceInput = document.getElementById('account-balance').previousElementSibling;
    balanceInput.textContent = currency === 'USD' ? '$' : currency === 'GBP' ? '£' : '€';
  });
  
  // Cargar las cuentas al iniciar
  loadAccounts();
});
