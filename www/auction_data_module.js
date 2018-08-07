var rowdata = [];
var update_needed;
var bdbName = "bidding_db2";
var storeName;
var bdb;
var ldata; //local data
var hyphen_today;
function memory_init_data() {

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
    var request = indexedDB.open(bdbName);
    request.onsuccess = function (e) {
        bdb = e.target.result;
    }

}
/////////////////////////////////////////////////////////
//////////////////MANAGE STORES//////////////////////////
/////////////////////////////////////////////////////////

function manage_object_stores(bdbName, storeName, rd) {
    var request = indexedDB.open(bdbName);
    request.onsuccess = function (e) {
        bdb = e.target.result;
        var version = parseInt(bdb.version);
        //check if the objectStore exists
        console.log("checking the store", bdb);
        if (bdb.objectStoreNames.contains(storeName))
        {
            //the storeName exists. Call startTransaction            
            console.log("secondRequest");

        } else {
            bdb.close();
            //objectStoreNames does not CONTAIN the storeName
            //Create new one
            var secondRequest = indexedDB.open(bdbName, version + 1);
            console.log("manage stores is processing version upgrade");
            secondRequest.onupgradeneeded = function (e) {
                bdb = e.target.result;
                try {
                    console.log("upgrading", version + 1);
                    var objectStore = bdb.createObjectStore(storeName, {
                        keyPath: 'lotid'
                    });
                    objectStore.createIndex("lotid", "lotid", {
                        unique: true
                    });
                    objectStore.createIndex("lot_no", "lot_no", {
                        unique: false
                    });
                    objectStore.createIndex("created_at_ibdb", "created_at_idb", {
                        unique: false
                    });
                    objectStore.createIndex("company_name, auction_date", ["company_name", "auction_date"], {
                        unique: false
                    });
                    objectStore.createIndex("exlot_no", "exlot_no", {
                        unique: false
                    });
                    objectStore.createIndex("exhibition_no", "exhibition_no", {
                        unique: false
                    });
                } catch (e) {
                    console.log(e.message);
                }
            };
            secondRequest.onsuccess = function (e) {
                e.target.result.close();
                console.log("new data store created");
                startTransaction(rd);
            }
            secondRequest.onerror = function (e) {
                console.log(e.target.error.message, "store Name failed to create?");
            }
        }

    };
    request.onerror = function (e) {
        console.log(e.type);
    }
}

function get_by_auction() {
    company_name = $("#auction_names").val();
    row_count = Number(document.querySelector("#auction_names")[document.querySelector("#auction_names").selectedIndex].getAttribute("count"));
    hyphen_today = today.split("/").reverse().join("-");

    storeName = company_name + hyphen_today;

    console.log("get_by_auct", company_name, hyphen_today);
    if (bdb.objectStoreNames.contains(storeName))
    {
        //the storeName exists. Data also exists?
        console.log(storeName, "exists, proceed to data retrieval");

        var store = bdb.transaction(storeName, "readonly").objectStore(storeName);
        var index = store.index('company_name, auction_date');
        console.log(company_name, storeName);
        keyRange = IDBKeyRange.only([company_name, hyphen_today]);


        console.log(index);
        // To use one of the key ranges, pass it in as the first argument of openCursor()/openKeyCursor()
        var request = index.count(keyRange);
        request.onsuccess = function (event) {
            big_data = [];
            var cursor = event.target.result;
            console.log(cursor, "row counts");

            if (cursor == row_count) {

                request = index.openCursor();

                request.onsuccess = function (event) {
                    var cursor = event.target.result;
                    if (cursor) {

                        big_data.push(cursor.value);

                        cursor.continue();
                    } else {
                        create_unique_list();
                        fn.load("main.html");
                    }
                }

            } else {


                var data = {
                    action: "bidders",
                    company_name: company_name,
                    auction_date: today,
                    username: username,
                    password: password
                };
                ajax(data);
            }
            console.log(row_count, cursor, "row count vs cursor length");
        };
        request.onerror = function (e)
        {
            console.log(e, "error loading data");
        }

    } else {
        bdb.close();
        console.log("closed bdb, storeName does not exist, will CREATE a store now");
        var data = {
            action: "bidders",
            company_name: company_name,
            auction_date: today,
            username: username,
            password: password
        };
        ajax(data);
    }
}

//recursive
function show_selected_chunk(i, endPos, indexName)
{
    //console.log("show_selected_chunk", company_name, hyphen_today, i, current_array.length, indexName);

    var tx = bdb.transaction(storeName, "readonly");
    var store = tx.objectStore(storeName);
    var page_data = [];
    var index = store.index(indexName);

try{
    request = index.openCursor(IDBKeyRange.only(current_array[i]));
}
    catch (e)
    {
        request = index.openCursor(IDBKeyRange.only(current_array[i]));
    }

    request.onsuccess = function (event) {
        var cursor = event.target.result;
        if (cursor) {
            if (cursor.value["exlot_no"] >= Number(startIndex) && cursor.value["exlot_no"] <= Number(endIndex))
            {
                page_data.push(cursor.value);
                //display the final data
            } else {
                ons.notification.alert("No data within the range");
            }
            cursor.continue();
        } else {
            show_big_data(page_data);
            page_data = [];
            if (i < endPos-1 && i < current_array.length - 1)
            {
                i++;
               //console.log("loading ", i, startPage);
                show_selected_chunk(i, endPos, indexName);
            } else {
                console.log("i:", i, "startPage:", startPage, "endPos:", endPos, "current_array.length:",  current_array.length);
                show_final_result();
            }
            //
        }
    };
    request.onerror = function (e)
    {
        console.log(cursor, "error");
    }
}

function show_final_result() {
    console.log('Entries all displayed.');
    $("#main_table").html(big_string);
    big_string = "";
    document.querySelector('#loading_circle').hide();
    $(".buyer_remark").each(function () {
        this.attachMessageData = attach_message_data;
        this.getByLotid = get_by_lotid;
        this.idbAddLot = idb_add_lot;
        this.updateLot = update_entry;
        this.saveStatus = save_status;
        this.getByLotid(); //also get the status?
    });
    startPage = get_startPage();
    if (startPage < Number(pager))
    {
        $("#previous_button").hide();
    } else
    {
        $("#previous_button").show();
    }
    if (Math.ceil(current_array.length / Number(pager)) == startPage / Number(pager)) {
        $("#next_button").hide();
    } else {
        $("#next_button").show();
    }
    //Math.ceil(current_array.length/pager) //get all page count

    //startPage/Number(pager)+1 //get the current page

    $("#heading2").text(get_shortName(company_name) + ": " + String($("#main_table ons-list-item.top_bid").length) + ", " + (startPage/Number(pager)+1) + "/" + Math.ceil(current_array.length/pager));
}
function update_entry()
{
    var caller = this;
    var objectStore = bdb.transaction([storeName], "readwrite").objectStore(storeName);
    var request = objectStore.get(Number(caller.getAttribute("lotid")));
    request.onerror = function (event) {
        // Handle errors!
        //console.log(event);
    };
    request.onsuccess = function (event) {
        // Get the old value that we want to update
        var data = event.target.result;
        // update the value(s) in the object that you want to change
        for (i in caller.arg)
        {
            data[i] = caller.arg[i];
        }
        // Put this updated object back into the database.
        var requestUpdate = objectStore.put(data);
        requestUpdate.onerror = function (event) {
            // Do something with the error
            //console.log(event);
        };
        requestUpdate.onsuccess = function (event) {
            // Success - the data is updated!
            //console.log(event);
            caller.getByLotid();
        };
    };
}

////console.log(rowdata);
function check_store(ind) {
//decide to CREATE an OBJECT STORE or NOT
    var request = indexedDB.open(bdbName);
    request.onsuccess = function (e) {
        bdb = e.target.result;
        try {

            var transaction = bdb.transaction([storeName]);
            var objectStore = transaction.objectStore(storeName);
            //bdb.close();
        } catch (e) {
            bdb.close();
            //console.log(e.message);
            //CreateObjectStore(bdbName, storeName, 1);
        }
    };
}

function startTransaction(rd) {
    //console.log(rd.length, "startTransaction");
    var request = indexedDB.open(bdbName);
    request.onsuccess = function (e) {
        bdb = e.target.result;
        //console.log(bdb);
        if (bdb.objectStoreNames.contains(storeName))
        {
            var transaction = bdb.transaction([storeName], "readwrite");
            var lotStore = transaction.objectStore(storeName);
            //console.log(lotStore);
            rd.forEach(function (lot) {
                ////console.log("adding rows " + lot); //JSON.stringify(lot)
                //add more properties here
                //
                //
                lot.created_at_idb = Date.now();
                lot.lotid = Number(lot.id);
                var request = lotStore.put(lot);
                //
                request.onsuccess = function (e) {
                    ////console.log(e.target.result + " " + " is the result id (key)");
                }
                request.oncomplete = function (e) {
                    //console.log(e.target.result + " data ADDED");
                    //e.target.result.close();
                }
            });
            //console.log(rd.length);
            // Do something when all the data is added to the database.
            transaction.oncomplete = function (event) {
                console.log("All done!");
                show_range();
                $("#search-range").text("Proceed");
                //HERE CALL display function
            };
            transaction.onerror = function (event) {
                // Don't forget to handle errors!
                //console.log(event);
                //console.log("error! " + event.target.error.message);
            };
        } else {
            //storeName missing
            bdb.close();
            //console.log(storeName, "missing");
            manage_object_stores(bdbName, storeName, rd);
        }
    };
    request.onerror = function (event) {
        //console.log(event);
    }
}
//test delete 
function retrieveData() {
    if (rowdata.length == 0) {
        var request = indexedDB.open(bdbName);
        request.onsuccess = function (e) {
            bdb = e.target.result;
            var objectStore = bdb.transaction(storeName).objectStore(storeName);
            var totalrows;
            var progressbar_steps;
            var page_count;
            var progpos = 0;
            var rowcount = 0;
            var pagerlimit = $("#selectmenu").val();
            objectStore.getAll().onsuccess = function (event) {
                //Count of all rows
                //endi pagerni necha sahifaligini bilsa buladi
                totalrows = event.target.result.length;
                page_count = totalrows / pagerlimit;
                progressbar_steps = 100 / pagerlimit;
                var data = event.target.result;
                var mycarstbody = $("#inner-tbody");
                for (i = 0; i < pagerlimit; i++) {
                    //////////////////////////
                }
            };
        };
        request.onerror = function (event) {
            //console.log(event.target.error.message);
        };
        request.oncomplete = function (event) {
            //console.log(event, "retrieve complete");
        };
    }
}


function deleteResult() {

    var transaction = bdb.transaction('mycars', 'readwrite');
    var objectStore = transaction.objectStore('mycars');
    objectStore.openCursor().onsuccess = function (event) {
        var cursor = event.target.result;
        if (cursor) {

            if (cursor.value.type == " ") {
                //console.log(cursor.value);
                var request = cursor.delete();
                request.onsuccess = function () {
                    //console.log('Deleted that mediocre album from 1984. Even Power windows is better.');
                };
            } else if (cursor.value.year.match(/\s+/g) != null || cursor.value.model.match(/\s+/g) != null) {
                for (var i in cursor.value)
                {
                    var val = cursor.value;
                    val[i] = val[i].replace(/\s+/g, "");
                    (i, cursor.value[i]);
                }

            }
            cursor.continue();
        } else {
            //console.log('Entries displayed.');
        }
    };
}

function updateResult() {

    var transaction = bdb.transaction('mycars', 'readwrite');
    var objectStore = transaction.objectStore('mycars');
    objectStore.openCursor().onsuccess = function (event) {
        var cursor = event.target.result;
        if (cursor) {
            if (cursor.value.juntypeyearmodel.match(/\s/g) != null) {
                var updateData = cursor.value;
                updateData.type = cursor.value.type.replace(/\s+/g, "");
                updateData.model = cursor.value.model.replace(/\s+/g, "");
                updateData.year = cursor.value.year.replace(/\s+/g, "");
                var request = cursor.update(updateData);
                request.onsuccess = function () {
                    //console.log('A better album year?');
                };
            } else {
                //console.log(cursor.value.type);
            }


////console.log(cursor.value.albumTitle, cursor.value.year);      
            cursor.continue();
        } else {
            //console.log('Entries displayed.');
        }
    }
}
