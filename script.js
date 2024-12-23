console.log("TO-DO list");
const PENDING = "pending";
const COMPLETE = "complete";
const TASKSTORAGE = "tasks";

const task = document.getElementById("tarea");
const addButton = document.getElementById("add");
const deleteButton = document.getElementById("delete");
const editButton = document.getElementById("edit");
const taskListDiv = document.getElementById("taskList");
const filterSelect = document.getElementById("filter");
let tasks = [];
let filterState = "all";
//obtengo el modal
const myModal = new bootstrap.Modal(document.getElementById("editDeleteModal"));
const modalTitle = document.getElementById("editDeleteModalLabel");
const modalBody = document.getElementById("editDeleteModalBody");
const modalCancel = document.getElementById("editDeleteModalCancel");
const modalSave = document.getElementById("editDeleteModalSave");

//read tasks localstorage
getTasksLocalStorage().then((tasks) => {
    addToTaskList(tasks);
});


//filter
filterSelect.addEventListener("change", (evento) => {
    console.log(evento.target.value);
    switch (evento.target.value) {
        case 'all':
            addToTaskList(tasks);
            filterState = "all";
            break;

        case PENDING:
            addToTaskList(tasks, PENDING);
            filterState = PENDING;

            break;

        case COMPLETE:
            addToTaskList(tasks, COMPLETE);
            filterState = COMPLETE;
            break;

        default:
            addToTaskList(tasks);
            break;
    }

})


function showModal(title, msj, cancel, save) {
    //abro modal 
    modalTitle.innerHTML = title;
    modalBody.innerHTML = msj;
    modalCancel.addEventListener("click", cancel);
    modalSave.addEventListener("click", save);
    myModal.show();
}
function closeModal() {
    myModal.hide();
}

//id
function nextId(tasks) {
    if (tasks.length == 0) return 1;
    return Math.max(...tasks.map(t => t.idTask)) + 1;
}
//new TAsk
addButton.addEventListener("click", (evento) => {

    if (task && task.value.trim().length > 0) {
        if (!isRepeatedTask(task.value)) {

            const idTask = nextId(tasks);
            const newTask = { descript: task.value.trim(), state: PENDING, idTask: idTask };
            tasks.push(newTask);
            console.log(tasks);
            saveTasksLocalStorage(tasks);
            addToTaskList(tasks);
        } else {
            console.log("Repeated");
        }
    }
});


function addToTaskList(array, filter = "all") {


    console.log("clean");
    cleanContainer(taskListDiv); //clean
    const frag = new DocumentFragment();

    for (let index = 0; index < array.length; index++) {

        const t = array[index];
        console.log("TTTTTTTT", t);


        const button = document.createElement("BUTTON");
        button.dataset.taskindex = t.idTask;
        button.id = t.idTask;

        button.setAttribute("draggable", "true");//for move 

        //dataTransfer
        button.addEventListener("dragstart", (evento) => {
            evento.dataTransfer.setData("text/plain", button.id);
        });

        console.log(t.state.trim());
        if (t.state.trim() == PENDING) {
            button.innerHTML = `${t.descript} <span class="badge text-bg-secondary" data-taskindex="${t.idTask}" data-change="${COMPLETE}"> Change Complete</span>`;
            button.classList.add("btn", "btn-outline-secondary", "w-75");

        } else {

            button.innerHTML = `${t.descript} <span class="badge text-bg-secondary" data-taskindex="${t.idTask}" data-change="${PENDING}"> Change Pending</span>`;
            button.classList.add("btn", "btn-outline-success");


        }
        frag.append(button);

        //PARA EL FILTRADO
        if (filter.trim() == PENDING) {
            if (t.state != PENDING) {
                button.classList.add("d-none");
            }
        }
        if (filter.trim() == COMPLETE) {
            if (t.state != COMPLETE) {
                button.classList.add("d-none");

            }
        }

    }
    taskListDiv.append(frag);//add tasks


}
taskListDiv.addEventListener("click", evento => {
    let target = evento.target;

    // change  state 
    if (target && target.matches("span[data-taskindex]")) {
        console.log(target.dataset.taskindex);
        console.log(target.dataset.change);
        let index = target.dataset.taskindex;
        let state = target.dataset.change;

        if (index) {
            let t = tasks.find(t => t.idTask == index);
            if (t) {
                t.state = state;
                console.log(t.state);
                console.log(tasks);
                addToTaskList(tasks);
                saveTasksLocalStorage();
            }

        }

    }



});
taskListDiv.addEventListener("dblclick", (evento) => {
    //dbclick boton
    const target = evento.target;
    if (target && target.matches("button[data-taskindex]")) {
        let index = target.dataset.taskindex;
        let descript = target.childNodes[0].textContent.trim();//access first nodo (2° span)
        console.log(descript);
        if (task.hasAttribute("readonly"))// esta en modo edicion y lo quiero a cambiar a normal sin el valor del task;
        {
            task.value = "";
        } else {
            task.value = descript;

        }

        switchEditDeleteMode();


    }
});
function switchEditDeleteMode() {
    editButton.toggleAttribute("disabled");
    deleteButton.toggleAttribute("disabled");
    task.toggleAttribute("readonly");//no esta en modo normal
    addButton.toggleAttribute("disabled");//no esta en modo normal


}
//delete task
deleteButton.addEventListener("click", evento => {
    console.log("delete");
    showModal("Delete TASK", "esta seguro de eliminar modal",
        (evento) => {
            console.log("cancel");
            modalCancel.click();
            switchEditDeleteMode();

        }, (evento) => {
            console.log("save");
            let descriptTask = task.value;
            tasks = tasks.filter(t => t.descript.trim() != descriptTask.trim());//remove del array
            addToTaskList(tasks);
            saveTasksLocalStorage();
            closeModal();

        });
});
//edit task
editButton.addEventListener("click", evento => {
    const IDINPUT = "inputTaskEdit";
    let descriptTask = task.value;
    console.log("edit");
    console.log(descriptTask);
    let innerHtml = `<div class="input-group input-group-sm mb-3">
  <span class="input-group-text" id="inputGroup-sizing-sm">TASK</span>
  <input type="text" class="form-control" aria-label="Sizing example input" aria-describedby="inputGroup-sizing-sm" id="${IDINPUT}" placeholder="${descriptTask}">
</div>`;
    showModal("Edit TASK", "Modifica y confirma cambio:" + innerHtml,
        evento => {

            console.log("cancel");
            modalCancel.click();
            switchEditDeleteMode();
        },

        evento => {
            console.log("save");
            let edition = document.getElementById(IDINPUT).value;//INPUT dom su valor
            console.log(edition);
            let taskEdit = tasks.find(t => t.descript.trim() == descriptTask.trim());//encontrar task con el valor
            console.log(taskEdit);

            if (edition && taskEdit && edition.trim() != "" && edition.trim().toLowerCase() != taskEdit.descript.trim().toLowerCase()) {
            //solo si es diferente se guarda
            console.log("NO pasa",edition);
                taskEdit.descript = edition.trim();
                addToTaskList(tasks);
                saveTasksLocalStorage();
                switchEditDeleteMode();
                task.value="";

            }
            closeModal();

        }
    )
})


//clean container
function cleanContainer(element) {
    while (element.firstChild) {
        element.removeChild(element.firstChild);
    };
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
taskListDiv.addEventListener("drop", (evento) => {
    evento.preventDefault(); // Prevenir el comportamiento por defecto

    // Verificar que el target es el contenedor de la lista de tareas
    const target = evento.target;

    // Asegurarnos de que el target es un botón dentro del contenedor taskListDiv
    if (target && target.matches("button")) {

        const draggedButtonId = evento.dataTransfer.getData("text/plain");// id del botón q estamos arrastando
        const draggedButton = document.getElementById(draggedButtonId);// el elemento del DOM del boton arrastrado
       

        console.log("id del boton q arrastamos", draggedButtonId);
        console.log("boton q arrastamos", draggedButton);
        

        if (draggedButton && target !== draggedButton) {
            // Obtener el índice de la tarea que fue arrastrada
            const draggedIndex = parseInt(draggedButton.id); //indice del botón arrastrado en el array de tareas
            console.log("id del boton", draggedIndex);

            // Obtener el índice del botón donde se soltó el botón arrastrado
            const allButtons = Array.from(taskListDiv.getElementsByTagName("button")); // obtenenos todos los botonoes de la lista en forma de array

            // const targetIndex = allButtons.indexOf(target);//indice del botón sobre el q se ha soltado el boton arrastrado
            const targetId = target.id;
            const indexTarget = tasks.findIndex(t => t.idTask == targetId);
            console.log("index del boton sobre el q se ha soltado", targetId);

            // Verificar que los íd son diferentes, si la tarea no se suelta sobre si misma 
            if (draggedIndex !== targetId) {
                // Reorganizar el array de tareas
                const draggedTask = tasks.find(t => t.idTask == draggedIndex); // se obtiene la tarea q del botón arrastrado
                const idBotonArrastrado = tasks.findIndex(t => t.idTask == draggedIndex);
                tasks.splice(idBotonArrastrado, 1); // Eliminar la tarea de su lugar original

                tasks.splice(indexTarget, 0, draggedTask); // Insertar la tarea en el nuevo índice

                // Actualizar la lista de tareas visualmente
                console.log("lista", tasks);
                addToTaskList(tasks, filterState);//PARA CUANDO ESTE EL FILTRADO 
                saveTasksLocalStorage();//save 
            }
        }
    }
});
