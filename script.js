import { Task } from "./task.js";

console.log("TO-DO list");
const PENDING = "pending";
const COMPLETE = "complete";
const ALL = "all";
const TASKSTORAGE = "tasks";

const task = document.getElementById("tarea"); //input
const pendingTaskSpan=document.getElementById("contadorPendientes");
const addButton = document.getElementById("add");
const deleteButton = document.getElementById("delete");
const editButton = document.getElementById("edit");
const taskListDiv = document.getElementById("taskList"); // contenedor
const filterSelect = document.getElementById("filter"); //select
let tasks = [];
let filterState = ALL;

//obtengo el modal
const myModal = new bootstrap.Modal(document.getElementById("editDeleteModal"));
const modalTitle = document.getElementById("editDeleteModalLabel");
const modalBody = document.getElementById("editDeleteModalBody");
const modalCancel = document.getElementById("editDeleteModalCancel");
const modalSave = document.getElementById("editDeleteModalSave");
const ID_INPUT_MODAL = "inputTaskEdit"; //id del input del modal para la edicion;


//read tasks localstorage
getTasksLocalStorage().then((tasks) => {
  addToTaskList(tasks);
addPendingTaskSpan();
});

//calcula cantidad  tareas  pendiente
function addPendingTaskSpan()
{
  let pendingTasks=tasks.filter(t=>t.state==PENDING);
  if(pendingTasks)
  {
    let numPending=pendingTasks.length;
    pendingTaskSpan.innerHTML=numPending;

  }
}

//evento cada vez q cambia el select cambia el filtrado VISUAL
filterSelect.addEventListener("change", (evento) => {
  console.log(evento.target.value);
  filterList(evento.target.value);
});
//asigna a varaible stado y filtra lista solo co display
function filterList(State) {
  switch (State) {
    case ALL:
      filterState = ALL;
      break;
    case PENDING:
      filterState = PENDING;
      break;
    case COMPLETE:
      filterState = COMPLETE;
      break;
    default:
      filterState = ALL;
      break;
  }

  if (filterState == ALL) {
    addToTaskList(tasks);
  } else {
    addToTaskList(tasks, filterState);
  }
}

// evento new TAsk
addButton.addEventListener("click", (evento) => {
  if (task && task.value.trim().length > 0) {
    if (!isRepeatedTask(task.value)) {
      const idTask = nextId(tasks);
      const newTask = new Task(task.value.trim(), PENDING, idTask);

      tasks.push(newTask);
      console.log(tasks);
      saveTasksLocalStorage(tasks);
      addPendingTaskSpan();
      addToTaskList(tasks);
    } else {
      console.log("Repeated");
    }
  }
});

//id para tarea nueva
function nextId(tasks) {
  if (tasks.length == 0) return 1;
  return Math.max(...tasks.map((t) => t.idTask)) + 1;
}
//dependiendo el stado de la tarea y lo q se paso filter se coloca clase d-none
function setFilterButton(button, filter, state) {
  //PARA EL FILTRADO
  if (
    (filter.trim() == PENDING && state !== PENDING) ||
    (filter.trim() == COMPLETE && state !== COMPLETE)
  ) {
    button.classList.add("d-none");
  }
}
function setDraggableButton(button) {
  button.setAttribute("draggable", "true"); //for move

  //dataTransfer
  button.addEventListener("dragstart", (evento) => {
    evento.dataTransfer.setData("text/plain", button.id);
  });
}
function createBottonTask(tarea) {
  const button = document.createElement("BUTTON");
  button.dataset.taskindex = tarea.idTask;
  button.id = tarea.idTask;

  console.log(tarea.state.trim());
  if (tarea.state.trim() == PENDING) {
    button.innerHTML = `${tarea.descript} <span class="badge text-bg-secondary" data-taskindex="${tarea.idTask}" data-change="${COMPLETE}"> Change Complete</span>`;
    button.classList.add("btn", "btn-outline-secondary", "w-75");
  } else {
    button.innerHTML = `${tarea.descript} <span class="badge text-bg-secondary" data-taskindex="${tarea.idTask}" data-change="${PENDING}"> Change Pending</span>`;
    button.classList.add("btn", "btn-outline-success");
  }
  return button;
}

function addToTaskList(array, filter = ALL) {
  console.log("clean");
  cleanContainer(taskListDiv); //clean
  const frag = new DocumentFragment();
  // recorre el array de tareas
  for (let index = 0; index < array.length; index++) {
    const t = array[index];
    console.log("Tarea: ", t);

    const button = createBottonTask(t);
    setDraggableButton(button);
    setFilterButton(button, filter, t.state);
    frag.append(button);
  }
  taskListDiv.append(frag); //add tasks
}

function switchStateTask(taskindex, state) {
  if (taskindex) {
    let t = tasks.find((t) => t.idTask == taskindex);
    if (t) {
      t.state = state;
      console.log(t.state);
      console.log(tasks);
      addToTaskList(tasks);
      addPendingTaskSpan();
      saveTasksLocalStorage();
    }
  }
}
//clik en span
taskListDiv.addEventListener("click", (evento) => {
  let target = evento.target;

  // change  state
  if (target && target.matches("span[data-taskindex]")) {
    console.log(target.dataset.taskindex);
    console.log(target.dataset.change);
    let index = target.dataset.taskindex;
    let state = target.dataset.change;
    switchStateTask(index, state);
  }
});
//evento doble click para edicion y delete
taskListDiv.addEventListener("dblclick", (evento) => {
  //dbclick boton
  const target = evento.target;
  if (target && target.matches("button[data-taskindex]")) {
    // let index = target.dataset.taskindex;
    let descript = target.childNodes[0].textContent.trim(); //access first nodo (2° span)
    console.log(descript);
    task.value = descript;
    modeEditDelte();
  }
});
function modeEditDelte() {
  console.log("mode edit/delete");

  task.setAttribute("readonly", true); //no esta en modo normal
  addButton.setAttribute("disabled", true);
  editButton.removeAttribute("disabled"); //esta puesto
  deleteButton.removeAttribute("disabled");
}
function removeModeEditDelete() {
  console.log("remove mode edit/delete");
  task.value = "";
  task.removeAttribute("readonly"); //no esta en modo normal
  addButton.removeAttribute("disabled");
  editButton.setAttribute("disabled", true); //esta puesto
  deleteButton.setAttribute("disabled", true);
}

function configMessageDelete() {
  const title = "Delete task ⚠️​";
  const msj = `Estas seguro de eliminar tarea: ${task.value} ?`;
  return { title, msj };
}
function configFunctionDelete() {
  const cancelDelete = (evento) => {
    console.log("cancel");

    removeModeEditDelete();
    modalCancel.click();
  };
  const confirmDelete = (evento) => {
    console.log("save");
    let descriptTask = task.value;
    tasks = tasks.filter((t) => t.descript.trim() != descriptTask.trim()); //remove del array
    addToTaskList(tasks);
    saveTasksLocalStorage();
    removeModeEditDelete();
    closeModal();
  };
  return { cancelDelete, confirmDelete };
}
//delete task
deleteButton.addEventListener("click", (evento) => {
  console.log("delete");

  const { title, msj } = configMessageDelete();
  const { cancelDelete, confirmDelete } = configFunctionDelete();

  showModal(title, msj, cancelDelete, confirmDelete);
});

function configMessageEdit() {
  console.log("edit");
  let descriptTask = task.value.trim();
  console.log(descriptTask);
  const HTML_MODAL = `<div class="input-group input-group-sm mb-3">
  <span class="input-group-text" id="inputGroup-sizing-sm">TASK</span>
  <input  type="text" maxlength="50" class="form-control" aria-label="Sizing example input" aria-describedby="inputGroup-sizing-sm" id="${ID_INPUT_MODAL}" placeholder="${descriptTask}">
</div>`;

  const title = "Edit task ​✏️​";
  const msj = "Modifica y confirma cambio: " + HTML_MODAL;
  return { title, msj };
}
function configFunctionEdit() {
  const cancelEdit = (evento) => {
    console.log("cancel");

    removeModeEditDelete();
    modalCancel.click();
  };
  const confirmEdit = (evento) => {
    console.log("save");
    let edition = document.getElementById(ID_INPUT_MODAL).value; //DOM INPUT del modal  su valor
    console.log(edition);
    let taskEdit = tasks.find((t) => t.descript.trim() == descriptTask); //encontrar task con el valor
    console.log(taskEdit);

    if (
      edition &&
      taskEdit &&
      edition.trim() != "" &&
      edition.trim().toLowerCase() != taskEdit.descript.trim().toLowerCase()
    ) {
      //solo si es diferente se guarda
      console.log("Edicion:", edition);
      taskEdit.descript = edition.trim(); //seteo nuevo valor
      addToTaskList(tasks);
      saveTasksLocalStorage();
      removeModeEditDelete();
      // task.value = "";
    }
    closeModal();
  };
  return { cancelEdit, confirmEdit };
}
//edit task
editButton.addEventListener("click", (evento) => {
  const { title, msj } = configMessageEdit();
  const { cancelEdit, confirmEdit } = configFunctionEdit();
  showModal(title, msj, cancelEdit, confirmEdit);
});

//clean container
function cleanContainer(element) {
  while (element.firstChild) {
    element.removeChild(element.firstChild);
  }
}
function isRepeatedTask(value) {
  let repeated = false;
  if (value != null && value.trim().length > 0) {
    for (let index = 0; index < tasks.length; index++) {
      const t = tasks[index];
      if (t.descript.trim().toLowerCase() == value.trim().toLowerCase()) {
        repeated = true;
        break;
      }
    }
  }
  return repeated;
}
async function getTasksLocalStorage() {
  let aux = localStorage.getItem(TASKSTORAGE);
  if (aux == null) aux = "[]";

  tasks = JSON.parse(aux);
  console.log(tasks);
  return await tasks;
}
function saveTasksLocalStorage() {
  let aux = JSON.stringify(tasks);
  localStorage.setItem(TASKSTORAGE, aux);
}
//DRAG & DROP
taskListDiv.addEventListener("dragover", (evento) => {
  evento.preventDefault();
});

function reorganizeTasks(oldIndex, newIndex, tarea) {
  tasks.splice(oldIndex, 1); // Eliminar la tarea de su lugar original

  tasks.splice(newIndex, 0, tarea); // Insertar la tarea en el nuevo índice
}
taskListDiv.addEventListener("drop", (evento) => {
  evento.preventDefault(); // Prevenir el comportamiento por defecto

  // Verificar que el target es el contenedor de la lista de tareas
  const target = evento.target; //ELEMNTO DONDE SE SOLTO el otro boton arrastrado

  // Asegurarnos de que el target es un botón dentro del contenedor taskListDiv
  if (target && target.matches("button")) {
    const draggedButtonId = evento.dataTransfer.getData("text/plain"); // id del botón q estamos arrastando
    const draggedButton = document.getElementById(draggedButtonId); // el elemento del DOM del boton arrastrado

    console.log("id del boton q arrastamos", draggedButtonId);
    console.log("boton q arrastamos", draggedButton);

    if (draggedButton && target !== draggedButton) {
      // si existe un boton arrastrado y este es distinto al boton donde se solto(target)

      const draggedID = parseInt(draggedButton.id); //ID del botón arrastrado en el array de tareas
      console.log("id del boton", draggedID);

      // const allButtons = Array.from(taskListDiv.getElementsByTagName("button")); // obtenenos todos los botonos de la lista en forma de array

      // const targetIndex = allButtons.indexOf(target);//indice del botón sobre el q se ha soltado el boton arrastrado
      const targetId = target.id; // Obtener el ID del botón donde se soltó el botón arrastrado
      const indexTarget = tasks.findIndex((t) => t.idTask == targetId);
      console.log("ID del boton sobre el q se ha soltado", targetId);

      // Verificar que los íd son diferentes, si la tarea no se suelta sobre si misma
      if (draggedID !== targetId) {
        // Reorganizar el array de tareas
        const draggedTask = tasks.find((t) => t.idTask == draggedID); // se obtiene la tarea q del botón arrastrado

        //se obtiene el index DEL ARRAY DE TAREAS por id del boton arrastado
        const indexBotonArrastrado = tasks.findIndex(
          (t) => t.idTask == draggedID
        );

        reorganizeTasks(indexBotonArrastrado, indexTarget, draggedTask);
        // tasks.splice(indexBotonArrastrado, 1); // Eliminar la tarea de su lugar original
        // tasks.splice(indexTarget, 0, draggedTask); // Insertar la tarea en el nuevo índice

        // Actualizar la lista de tareas visualmente
        console.log("lista", tasks);
        addToTaskList(tasks, filterState); //PARA CUANDO ESTE EL FILTRADO
        saveTasksLocalStorage(); //save
      }
    }
  }
});
// Inicializa todos los tooltips
document.addEventListener("DOMContentLoaded", function () {
  var tooltipTriggerList = [].slice.call(
    document.querySelectorAll('[data-bs-toggle="tooltip"]')
  );
  var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
    return new bootstrap.Tooltip(tooltipTriggerEl);
  });
});

//modal

function showModal(title, msj, cancel, save) {
  //abro modal
  modalTitle.innerHTML = title;
  modalBody.innerHTML = msj;
  //Agrega evento
  modalCancel.addEventListener("click", cancel);
  modalSave.addEventListener("click", save);
  myModal.show();
}
function closeModal() {
  myModal.hide();
}
