const { response } = require("express");

let db;
let version;

const request = indexedDB.open("BudgetDB", version || 1);

request.onupgradeneeded = function (event) {
  const { prevVersion } = event;
  const newVersion = event.newVersion || db.version;
  db = event.target.result;
  if (db.objectStoreNames.length === 0) {
    db.objectStoreNames("BudgetStore", { autoIncrement: true });
  }
};

request.onerror = function (event) {
  console.log(event.target.errorCode);
};

function checkDatabase() {
  let transaction = db.transaction(["BudgetStore"], "readwrite");
  const store = transaction.objectStore("BudgetStore");
  const getAll = store.getAll();
  getAll.onsuccess = function () {
    if (getAll.result.length > 0) {
      fetch("/api/transaction/bulk", {
        method: "post",
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: "application/json, text/plain, */*",
          "Content-Type": "application/json",
        },
      })
        .then((response) => response.json())
        .then((res) => {
          if (res.length !== 0) {
            transaction = db.transaction(["BudgetStore"], "readwrite");
            const currentStore = transaction.objectStore("BudgetStore");
            currentStore.clear();
          }
        });
    }
  };
}

request.onsuccess = function (event) {
  db = event.target.result;

  if (navigator.onLine) {
    checkDatabase();
  }
};

const saveRecord = (data) => {
    const transaction = db.transaction(["BudgetStore"], "readwrite");
    const store = transaction.objectStore("BudgetStore");
    store.add(data)
}

window.addEventListener('online', checkDatabase)