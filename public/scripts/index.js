// Activate carousel on equipment show page
$(function () {
    $('.carousel-inner').find('.carousel-item:first').addClass("active");
})

function ValidateImageFileSize(file) {
    let maxFileSize = 1; // in MB
    let fileSize = file.files[0].size / 1024 / 1024; // convert to MB
    let fileName = file.files[0].name;
    if (fileSize > maxFileSize) {
        $(file).val(''); //for clearing with Jquery
        $(".custom-file-label").html("");
        alert('File size exceeds ' + maxFileSize + ' MB');
    } else {
        $(".custom-file-label").html(fileName);
    }
}

function ValidateDatasheetFileSize(file) {
    let maxFileSize = 3; // in MB
    let fileSize = file.files[0].size / 1024 / 1024; // convert to MB
    let fileName = file.files[0].name;
    if (fileSize > maxFileSize) {
        $(file).val(''); //for clearing with Jquery
        $(".custom-file-label").html("");
        alert('File size exceeds ' + maxFileSize + ' MB');
    } else {
        $(".custom-file-label").html(fileName);
    }
}

// function is called when any equipment-index-card-image is clicked
function createComparisonSet(element) {
    let comparisonArray = []; // holds the ids of equipment to compare
    let compareSetIds = new Set();
    let comparisonArrayNames = []; // holds the names of equipment to compare
    let compareSetNames = new Set();
    let idKey = 'compareSetId';
    let nameKey = 'compareSetName';
    let maxCompare = 2;

    if (sessionStorage.getItem(idKey)) {
        comparisonArray = JSON.parse(sessionStorage.getItem(idKey));
        comparisonArray.forEach(id => {
            compareSetIds.add(id);
        })
    }

    if (sessionStorage.getItem(nameKey)) {
        comparisonArrayNames = JSON.parse(sessionStorage.getItem(nameKey));
        comparisonArrayNames.forEach(name => {
            compareSetNames.add(name);
        })
    }

    let value = $(element).parent().parent().find(".store-equipmentId").text(); // read from hidden element
    let name = $(element).parent().parent().find(".store-equipmentName").text(); // read from hidden element
    if (compareSetIds.has(value)) {
        compareSetIds.delete(value);
        compareSetNames.delete(name);
        $(element).parent().parent().removeClass('comparison-selected');
    } else {
        if (compareSetIds.size < maxCompare) {
            compareSetIds.add(value);
            compareSetNames.add(name);
            $(element).parent().parent().addClass('comparison-selected');
        }
    }
    comparisonArray = [...compareSetIds];
    comparisonArrayNames = [...compareSetNames];

    $('#compareSetStore').val(comparisonArray.join());
    $('#compareSetDisplay').val(comparisonArrayNames.join(' & '));

    sessionStorage.setItem(idKey, JSON.stringify(comparisonArray));
    sessionStorage.setItem(nameKey, JSON.stringify(comparisonArrayNames));

}

$(function () {
    let idKey = 'compareSetId';
    let nameKey = 'compareSetName';
    let arrayOfIds = [];

    if (sessionStorage.getItem(idKey)) {
        $(".store-equipmentId").each(function () {
            arrayOfIds = JSON.parse(sessionStorage.getItem(idKey));
            let storeEquipmentIdText = this.innerHTML;
            if (arrayOfIds.includes(storeEquipmentIdText)) {
                $(this).parent().parent().addClass('comparison-selected');
            }
        });
        comparisonArray = JSON.parse(sessionStorage.getItem(idKey));
        $('#compareSetStore').val(comparisonArray.join());
        comparisonArrayNames = JSON.parse(sessionStorage.getItem(nameKey));
        $('#compareSetDisplay').val(comparisonArrayNames.join(' & '));
    }
})

function clearSelected() {
    let idKey = 'compareSetId';
    let nameKey = 'compareSetName';

    if (sessionStorage.getItem(idKey)) {
        sessionStorage.removeItem(idKey);
    }

    if (sessionStorage.getItem(nameKey)) {
        sessionStorage.removeItem(nameKey);
    }

    $('.equipment-index-card').removeClass('comparison-selected');
    $('#compareSetDisplay').val('');
    $('#compareSetStore').val('');
}

// Remember search terms
function submitSearchTerms(element) {
    let searchTerms = $('#searchTerms').val();
    sessionStorage.setItem('searchTerms', JSON.stringify(searchTerms));
}

// On page load restore search terms from session memory
$(function () {
    if (sessionStorage.getItem('searchTerms')) {
        $('#searchTerms').val(JSON.parse(sessionStorage.getItem('searchTerms')));
    }
})

function onChangeFilterChecks() {
    let mineralFilter = [];
    let miningMethodFilter = [];
    let miningTypeFilter = []
    let mineActivityFilter = []
    let miningCycleFilter = []

    // miningType
    if ($('#filter_mining_type_underground').prop("checked") == true) {
        miningTypeFilter.push('Underground')
    }
    if ($('#filter_mining_type_surface').prop("checked") == true) {
        miningTypeFilter.push('Surface')
    }
    if ($('#filter_mining_type_mineral_processing_and_beneficiation').prop("checked") == true) {
        miningTypeFilter.push('Mineral Processing and Beneficiation')
    }
    if (miningTypeFilter.length > 0) {
        $('#miningTypeFilter').val(miningTypeFilter.join(','))
    }

    // miningCycle
    if ($('#filter_mining_cycle_mine_development').prop("checked") == true) {
        miningCycleFilter.push('Mine Development')
    }
    if ($('#filter_mining_cycle_access_development').prop("checked") == true) {
        miningCycleFilter.push('Access Development')
    }
    if ($('#filter_mining_cycle_logistics').prop("checked") == true) {
        miningCycleFilter.push('Logistics')
    }
    if ($('#filter_mining_cycle_stopping').prop("checked") == true) {
        miningCycleFilter.push('Stopping')
    }
    if (miningCycleFilter.length > 0) {
        $('#miningCycleFilter').val(miningCycleFilter.join(','))
    }

    // mineActivity
    if ($('#filter_mining_activity_drilling').prop("checked") == true) {
        mineActivityFilter.push('Drilling')
    }
    if ($('#filter_mining_activity_blasting').prop("checked") == true) {
        mineActivityFilter.push('Blasting')
    }
    if ($('#filter_mining_activity_cleaning').prop("checked") == true) {
        mineActivityFilter.push('Cleaning')
    }
    if ($('#filter_mining_activity_supporting').prop("checked") == true) {
        mineActivityFilter.push('Supporting')
    }
    if (mineActivityFilter.length > 0) {
        $('#miningActivityFilter').val(mineActivityFilter.join(','))
    }

    // mining method
    if ($('#filter_mining_method_mechanised').prop("checked") == true) {
        miningMethodFilter.push('Mechanised')
    }
    if ($('#filter_mining_method_conventional').prop("checked") == true) {
        miningMethodFilter.push('Conventional')
    }
    if ($('#filter_mining_method_hybrid').prop("checked") == true) {
        miningMethodFilter.push('Hybrid')
    }
    if ($('#filter_mining_method_autonomous').prop("checked") == true) {
        miningMethodFilter.push('Autonomous')
    }
    if (miningMethodFilter.length > 0) {
        $('#miningMethodFilter').val(miningMethodFilter.join(','))
    }

    // mineral
    if ($('#filter_mineral_gold').prop("checked") == true) {
        mineralFilter.push('Gold')
    }
    if ($('#filter_mineral_platinum').prop("checked") == true) {
        mineralFilter.push('Platinum')
    }
    if ($('#filter_mineral_coal').prop("checked") == true) {
        mineralFilter.push('Coal')
    }
    if ($('#filter_mineral_diamonds').prop("checked") == true) {
        mineralFilter.push('Diamonds')
    }
    if ($('#filter_mineral_base_metals').prop("checked") == true) {
        mineralFilter.push('Base Metals')
    }
    if ($('#filter_mineral_other').prop("checked") == true) {
        mineralFilter.push('Other')
    }
    if (mineralFilter.length > 0) {
        $('#mineralFilter').val(mineralFilter.join(','))
    }

    $('#filterForm').submit()
}

// Remeber filter selections
function submitFilterTerms(element) {
    arrayOfFilters = [];

    let miningCycle = $('#miningCycle option:selected').text();
    arrayOfFilters.push(miningCycle);
    let miningCycleIndex = $('#miningCycle').prop('selectedIndex');
    sessionStorage.setItem('miningCycle', miningCycleIndex);

    let mineActivity = $('#mineActivity option:selected').text();
    arrayOfFilters.push(mineActivity);
    let mineActivityIndex = $('#mineActivity').prop('selectedIndex');
    sessionStorage.setItem('mineActivity', mineActivityIndex);

    let miningMethod = $('#miningMethod option:selected').text();
    arrayOfFilters.push(miningMethod);
    let miningMethodIndex = $('#miningMethod').prop('selectedIndex');
    sessionStorage.setItem('miningMethod', miningMethodIndex);

    let mineral = $('#mineral option:selected').text();
    arrayOfFilters.push(mineral);
    let mineralIndex = $('#mineral').prop('selectedIndex');
    sessionStorage.setItem('mineral', mineralIndex);

    $('#filterParams').val(arrayOfFilters.join());

}

function submitGraphicalFilterTerms(element) {
    let miningOperationsTerms = ['miningCycle', 'mineActivity', 'miningMethod', 'mineral'];
    let miningCycles = ['Mine Development', 'Access Development', 'Stoping', 'Logistics'];
    let mineActivities = ['Drilling', 'Blasting', 'Cleaning', 'Supporting', 'Services'];

    if (sessionStorage.getItem(miningOperationsTerms[0])) {
        sessionStorage.removeItem(miningOperationsTerms[0]);
    }

    if (sessionStorage.getItem(miningOperationsTerms[1])) {
        sessionStorage.removeItem(miningOperationsTerms[1]);
    }

    let filterTerms = $(element).closest('form').find('input').attr('value');

    let filterFieldsArray = filterTerms.split(',').map(item => item.trim());

    let miningCycleIndex = miningCycles.indexOf(filterFieldsArray[0]) + 1; // +1 because 'None' selection is index 0

    let mineActivityIndex = mineActivities.indexOf(filterFieldsArray[1]) + 1; // +1 because 'None' selection is index 0

    sessionStorage.setItem(miningOperationsTerms[0], miningCycleIndex);
    sessionStorage.setItem(miningOperationsTerms[1], mineActivityIndex);
}

// On page load, restore filters from session memory
$(function () {
    if (sessionStorage.getItem('miningCycle'))
        $('#miningCycle').prop('selectedIndex', JSON.parse(sessionStorage.getItem('miningCycle')));

    if (sessionStorage.getItem('mineActivity'))
        $('#mineActivity').prop('selectedIndex', JSON.parse(sessionStorage.getItem('mineActivity')));

    if (sessionStorage.getItem('miningMethod'))
        $('#miningMethod').prop('selectedIndex', JSON.parse(sessionStorage.getItem('miningMethod')));

    if (sessionStorage.getItem('mineral'))
        $('#mineral').prop('selectedIndex', JSON.parse(sessionStorage.getItem('mineral')));
})

$(function () {
    $('[data-toggle="popover"]').popover({
        html: true,
        trigger: 'hover',
        placement: 'bottom',
        container: 'body',
        content: function () { return '<img src="' + $(this).data('img') + '" />'; }
    });
})

function formatDate(date) {
    var d = new Date(date),
        month = '' + (d.getMonth() + 1),
        day = '' + d.getDate(),
        year = d.getFullYear();

    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;

    return [month, day, year].join('/');
}

function goBack() {
    window.history.back();
}



