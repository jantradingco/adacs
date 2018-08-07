var sampledata = [];
var storeName;
var dbName = "temp_database";
var db;

function memory_init() {

}

function initiateDate() {
    $('.jans_auction_date').Zebra_DatePicker({
        format: 'd/m/Y',
        onSelect: function () {
            //saveDate()
        }
    });
}

window.indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
window.IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction || window.msIDBTransaction || {
    READ_WRITE: "readwrite"
};
IDBKeyRange = window.IDBKeyRange || window.webkitIDBKeyRange || window.msIDBKeyRange;

if (!window.indexedDB) {
    window.alert("Your browser doesn't support a stable version of IndexedDB. Some features will not be available.");
} else {
    //start
    //console.log("indexdb can be initiated");
}


/* VERSION CHECK 
 Use this if needed
 */
//check_store("autopick", "carnametypeyear", 1);


function show_remark_modal() {
    event.preventDefault();
    event.stopPropagation();

    $("#remarkModal").show();
    $("#remarkModal .lotid")[0].setAttribute("lotid", event.target.parentElement.parentElement.parentElement.getElementsByClassName("buyer_remark")[0].getAttribute("lotid"));
    $("#remarkModal .lotid")[0].caller = event.target.parentElement.parentElement.parentElement.getElementsByClassName("buyer_remark")[0];
    if (event.target.parentElement.parentElement.parentElement.getElementsByClassName("buyer_remark")[0].mdata)
    {
        $("#remarkModal textarea")[0].value = event.target.parentElement.parentElement.parentElement.getElementsByClassName("buyer_remark")[0].mdata.remarks;
    } else {
        $("#remarkModal textarea")[0].value = "";
    }
}
function save_remarks()
{
    var target = event.target.parentElement.parentElement.parentElement.parentElement.getElementsByClassName("lotid")[0].caller;
    if (target.mdata)
    {
        //mdata exists
        target.mdata.remarks = event.target.parentElement.parentElement.parentElement.parentElement.querySelector("#buyer_remark_text").value;
        target.idbAddLot(target.mdata);
    } else {
        //create new mdata object
        var lot = {
            created_at: Date.now(),
            lotid: Number(event.target.parentElement.parentElement.parentElement.getElementsByClassName("lotid")[0].getAttribute("lotid")),
            remarks: event.target.parentElement.parentElement.parentElement.querySelector("#buyer_remark_text").value
        };
        target.idbAddLot(lot);
    }
    close_modals();
}

function save_status(status)
{
    var the_target_img_object = this;
    var lotid = Number(the_target_img_object.getAttribute("lotid"));

    var objectStore = db.transaction(["lot"], "readwrite").objectStore("lot");
    var request = objectStore.get(lotid);
    request.onerror = function (event) {
        // Handle errors!
        console.log("error");
    };
    request.onsuccess = function (event) {
        // Get the old value that we want to update
        var data = event.target.result;
        if (data)
        {
            // update the value(s) in the object that you want to change
            data.status = status;

            // Put this updated object back into the database.
            var requestUpdate = objectStore.put(data);
            requestUpdate.onerror = function (event) {
                // Do something with the error
            };
            requestUpdate.onsuccess = function (event) {
                // Success - the data is updated!
                console.log("updated");
            };
        } else {
            //lot not exist
            var lot = {
                created_at: Date.now(),
                lotid: Number(lotid),
                status: status,
                remarks: ""
            };
            the_target_img_object.idbAddLot(lot);
        }

    };
}

function firstRun(currentversion) {

    try {

        var request = indexedDB.open(dbName, currentversion);
    } catch (e)
    {
        console.log(e.message, "Client needs a new version of IndexedDB. Now attempting to open without version");
        var request = indexedDB.open(dbName);
    }
    request.onsuccess = function (e) {
        db = e.target.result;
        var version = parseInt(db.version);
        var dateindex;
        try {
            for (var i = 0; i < db.transaction("lot", "readonly").objectStore("lot").indexNames.length; i++)
            {
                if (db.transaction("lot", "readonly").objectStore("lot").indexNames[i] == "created_at")
                {
                    dateindex = true;
                }
            }

            if (Boolean(dateindex))
            {

            } else {
                db.close();
                //firstRun(version + 1);
            }
        } catch (e)
        {
            db.close();
            var DBDeleteRequest = window.indexedDB.deleteDatabase(dbName);
            DBDeleteRequest.onerror = function (event) {
                console.log("Error deleting database.");
            };
            DBDeleteRequest.onsuccess = function (event) {
                console.log("Database deleted successfully");
                console.log(event.result); // should be undefined
            };
        }




        ///////////////DB/VERSION/CONTROL/////////////////////////////////////////

        //console.log(dbName + " version ", version);



    };
    request.onupgradeneeded = function (e) {
        db = e.target.result;

        if (e.oldVersion < 1) {

            console.log("upgrading");
            //type+model+year - price/remark
            var objectStore = db.createObjectStore("lot", {
                keyPath: 'lotid'
            });
            objectStore.createIndex("lotid", "lotid", {
                unique: true
            });
            objectStore.createIndex("created_at", "created_at", {
                unique: false
            });



        } else if (e.oldVersion < currentversion) {

            db = e.target.result;

            console.log("upgrading to version " + currentversion);
            //ANY UPGRADE CODE

            //Main memory for all lots
            try {
                //var objectStore = request.transaction.objectStore("lot");
                //var dateIndex = objectStore.createIndex("by_date", "date");
            } catch (e)
            {
                console.log(e);
            }



        }
        request.onerror = function (e) {
            console.log(e.type);
        }
        request.complete = function (e) {
            //e.target.result.close();
            console.log("new data store created");

        }

    }

    //migrateMemory();
}

function get_by_status(status) {

    current_array = [];

    var d = Date.now();
    d -= 54000000; //getting 15 hours back time

    var tx = db.transaction("lot", "readonly");
    var index = tx.objectStore("lot").index("created_at");
    var objectStoreRequest = index.getAll();

    objectStoreRequest.onsuccess = function (event) {
        // report the success of our request

        //caller.attachMessageData(event.target.result);
        for (var i = 0; i < event.target.result.length; i++)
        {
            console.log(event.target.result[i]["created_at"], d);
            if (event.target.result[i]["created_at"] > d && event.target.result[i]["status"]==status) {
                console.log(event.target.result[i]["lotid"]);
                current_array.push(event.target.result[i]["lotid"]);
            }
        }
        if (current_array.length > 0)
        {
            show_selected_chunk(startPage, current_array, "lotid");
        } else {
            ons.notification.toast("No data");
        }
    };
    objectStoreRequest.onerror = function (event) {
        console.log(event);
    };
    objectStoreRequest.oncomplete = function (event) {
        //console.log(event);
    }
}

function get_by_lotid() {
    var caller = this;
    var tx = db.transaction("lot", "readonly");
    var store = tx.objectStore("lot");
    var objectStoreRequest = store.get(Number(this.getAttribute("lotid")));

    objectStoreRequest.onsuccess = function (event) {
        // report the success of our request
        //console.log(event.target.result);
        caller.attachMessageData(event.target.result);
    };
    objectStoreRequest.onerror = function (event) {
        console.log(event);
    };
    objectStoreRequest.oncomplete = function (event) {
        //console.log(event);
    }
}

function attach_message_data(cph) {
    if (cph != undefined) {
        try {
            this.mdata = cph;
            if (cph.message)
            {
                //show message dots
                this.classList.remove("hidden");
            } else if (cph.remarks != "" || cph.status != "")
            {
                //remarks not empty
                //console.log(this, this.getAttribute("lotid"), document.getElementsByClassName(this.getAttribute("lotid"))[0]);
                document.getElementsByClassName(this.getAttribute("lotid"))[0].getElementsByClassName("buyer_remarks")[0].innerText = cph.remarks;
                document.getElementsByClassName(this.getAttribute("lotid"))[0].classList.add(cph.status);
                
            }
            //console.log(cph);
            
        } catch (e) {
            console.log(e.message);
        }
    }
}

function idb_add_lot(lot) {
    var caller = this;
    var tx = db.transaction("lot", "readwrite");
    var store = tx.objectStore("lot");

    store.put(lot);

    tx.oncomplete = function () {
        // All requests have succeeded and the transaction has committed.
        //console.log("lot saved");
        caller.getByLotid();
    };
    tx.onerror = function (e) {
        e.result = undefined;
        console.log("error: ", e.target.error.message);
    };
}

firstRun(undefined);

