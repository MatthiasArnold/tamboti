$(function() {
    $('#keyword-form').submit(function () {
        loadIndexTerms();
        return false; 
    });
    initCollectionTree();
});


/* collection action buttons */
function hideCollectionActionButtons() { 
    $('#collection-create-folder').hide();
    $('#collection-rename-folder').hide();
    $('#collection-move-folder').hide();
    $('#collection-remove-folder').hide();
    $('#collection-sharing').hide();
    $('#collection-create-resource').hide();
    
    $('#remove-group-button').hide();
};

/* sharing dialog actions */
$(document).ready(function(){

    hideCollectionActionButtons();
    
    updateSharingGroupMembers($('#group-list').val());
    $('#group-list').change(function(){
        updateSharingGroupMembers($('#group-list').val());
    });
    
    //add member to group events
    $('#add-new-member-to-group-button').click(function(){
        $('#add-member-to-group-sharing-dialog').dialog('open');
    });
    
    $('#add-member-to-group-button').click(function(){
        addMemberToSharingGroupMembers($('#members-list').val(), true);
        $('#add-member-to-group-sharing-dialog').dialog('close');
    });
    
    //add group events
    $('#remove-group-button').click(function(){
        removeGroup();
    });
    $('#new-group-button').click(function(){
        $('#new-group-sharing-dialog').dialog('open');
    });
    
    $('#add-group-button').click(function(){
        addNewGroupToGroupList($('#new-group-name').val());
        $('#new-group-sharing-dialog').dialog('close');
    });
    
    showNotices();
});

function getCurrentCollection() {
    return "/db" + $('#simple-search-form input[name = collection]').val();
}

function showNotices() {

    $('#notices-dialog').dialog({
        modal: true,
        width: 460,
        close: function(event, ui) {
            var params = { action: "seen-notices" };
            $.get("notices.xql", params, function (data) {
            });
        }
    });
}

/*
    Initialize the collection tree. Connect toolbar button events.
 */
function initCollectionTree() {
    var dynaTree = $('#collection-tree-tree');
    var treeDiv = $('#collection-tree-main').css('display', 'none');
    dynaTree.dynatree({
        fx: { height: "toggle", duration: 200 },
        persist: true,
        initAjax: { 
            url: "collections.xql"
        },
        autoFocus: false,
        onActivate: function (dtnode) {
            /**
            Executed when a tree node is clicked
            */
            var title = dtnode.data.title;
            var key = dtnode.data.key;
            updateCollectionPaths(title, key);
            showHideCollectionControls();
        },
        onLazyRead: function(node){
            node.appendAjax({
                url: "collections.xql",
	            data: { 
	               key: node.data.key
               }
              });
        },

        onPostInit: function () {
            // when tree is reloaded, reactivate the current node to trigger an onActivate event
            this.reactivate();
        },
        clickFolderMode: 1,
        onDblClick: function (node) {
            $('#simple-search-form input[name=input1]').val('');
            $('#simple-search-form').submit();
            return false;
        }
    });
    toggleCollectionTree($('#collection-tree').hasClass('show'));
    $('#toggle-collection-tree').click(function () {
        if (treeDiv.css('display') == 'none') {
            toggleCollectionTree(true);
        } else {
            toggleCollectionTree(false);
        }
    });
    $('#collection-expand-all').click(function () {
        $("#collection-tree-tree").dynatree("getRoot").visit(function(dtnode){
            dtnode.expand(true);
        });
        return false;
    });
    $('#collection-collapse-all').click(function () {
        $("#collection-tree-tree").dynatree("getRoot").visit(function(dtnode){
            dtnode.expand(false);
        });
        return false;
    });
    $('#collection-reload').click(function () {
        //reload the entire tree
        var tree = $("#collection-tree-tree").dynatree("getTree");
		if(tree) {
			tree.reload();
		}
		return false;
    });
}

function toggleCollectionTree(show) {
    if (show) {
        $('#collection-tree').css({width: '300px', height: 'auto', 'background-color': 'transparent'});
        $('#main-content').css('margin-left', '310px');
        $('#collection-tree-main').css('display', '');
        $('#simple-search-form input[name = collection-tree]').val('show');
        $('#advanced-search-form input[name = collection-tree]').val('show');
    } else {
        $('#collection-tree').css({width: '40px', height: '400px', 'background-color': '#CCC'});
        $('#main-content').css('margin-left', '50px');
        $('#collection-tree-main').css('display', 'none');
        $('#simple-search-form input[name = collection-tree]').val('hidden');
        $('#advanced-search-form input[name = collection-tree]').val('hidden');
    }
}

function updateCollectionPaths(title, key) {
    key = key.replace(/^\/db/, "");
    
    //search forms
    var form = $('#simple-search-form');
    $('input[name = collection]', form).val(key);
    
    var form = $('#advanced-search-form');
    $('input[name = collection]', form).val(key);
    
    //dialog collection paths
    $('span[id $= collection-path_]').text(title);
    $('input[id $= collection-path_]').val(key);
    
    // $('#collection-create-resource').attr("href", "../edit/edit.xq?type=book-chapter&collection=" + key);
};

function showHideCollectionControls() {
    var collection = getCurrentCollection();
    
    var params = { action: "collection-relationship", collection: collection };
    $.get("checkuser.xql", params, function(data) {
    
        /**
         data looks like this -
        
            <relationship user="" collection="">
                <read></read>
                <write></write>
                <home></home>
                <owner></owner>
            </relationship>
        */
    
        var write = $(data).find('write');
        var isWriteable = (write != null && write.text() == 'true');
        
        var home = $(data).find('home');
        var isUsersHome = (home != null && home.text() == 'true');
        
        var owner = $(data).find('owner');
        var isOwner = (owner != null && owner.text() == 'true');
        
        //collection is writeable
        if(isWriteable){
             $('#collection-create-folder').show();
             $('#collection-create-resource').show();
        } else {
            $('#collection-create-folder').hide();
            $('#collection-create-resource').hide();
        }
        
        //collection is not current users home and is owned by current user
        if(!isUsersHome && isOwner) {
            $('#collection-sharing').show();
        } else {
            $('#collection-sharing').hide();
        }
        
        //collection is writeable and not the current users home and the current user is the owner
        if(isWriteable && !isUsersHome && isOwner) {
            $('#collection-rename-folder').show();
            $('#collection-move-folder').show();
            $('#collection-remove-folder').show();
        } else {
            $('#collection-rename-folder').hide();
            $('#collection-move-folder').hide();
            $('#collection-remove-folder').hide();
        }
    });
};

/*
    Called when the user clicks on the "remove" button in the remove resource dialog
 */
function removeResource(dialog) {
    var resource = $('#remove-resource-form input[name = resource]').val();
    var params = { action: 'remove-resource', resource: resource };
    $.get("operations.xql", params, function (data) {
        dialog.dialog("close");
        $(location).attr('href', 'index.html?reload=true&collection=' + getCurrentCollection());
    });
}

/*
    Called when the user clicks on the "move" button in the remove resource dialog
 */
function moveResource(dialog) {
    var path = $('#move-resource-form select[name = path]').val();
    var resource = $('#move-resource-form input[name = resource]').val();
    var params = { action: 'move-resource', path: path, resource: resource };
    $.get("operations.xql", params, function (data) {
        dialog.dialog("close");
    });
}

/*
    Called when the user clicks on the "create" button in the create collection dialog.
 */
function createCollection(dialog) {
    var name = $('#create-collection-form input[name = name]').val();
    var collection = getCurrentCollection();
    var params = { action: 'create-collection', name: name, collection: collection };
    $.get("operations.xql", params, function (data) {
        
        //reload the tree node
        refreshCurrentTreeNode();
        
        //close the dialog
        dialog.dialog("close");
    });
}

//refreshes the tree node
function refreshTreeNode(node) {
	if(node) {
        node.reloadChildren(function(node, isOk){
            //alert("reloaded node" + node);
        });
    }
}


//refreshes the tree node
function refreshTreeNodeAndFocusOnChild(node, focusOnKey) {
	if(node) {
        node.reloadChildren(function(node, isOk){
            $(node.childList).each(function(index, child){
                if(child.data.key == focusOnKey) {
                    child.activate();
                }
            });
        });
    }
}

//refreshes the currently selected tree node
function refreshCurrentTreeNode() {
    var node = $("#collection-tree-tree").dynatree("getActiveNode");
	refreshTreeNode(node);
}

//refreshes the parent of the currently selected tree node
function refreshParentTreeNode() {
    //reload the parent tree node
    var parentNode = $("#collection-tree-tree").dynatree("getActiveNode").getParent();
    refreshTreeNode(parentNode);
    parentNode.expand(true); //expand the node after reloading the children
}

function refreshParentTreeNodeAndFocusOnChild(focusOnKey) {
    //reload the parent tree node
    
    //find parent of the key to focus on
    var parentFocusKey = focusOnKey.replace(/(.*)\/.*/, "$1");
    var tree = $("#collection-tree-tree").dynatree("getTree");
    var parentNode = tree.getNodeByKey(parentFocusKey);
    
    refreshTreeNodeAndFocusOnChild(parentNode, focusOnKey);
    parentNode.expand(true); //expand the node after reloading the children
}

/*
    Called when the user clicks on the "rename" button in the rename collection dialog.
 */
function renameCollection(dialog) {
    var name = $('#rename-collection-form input[name = name]').val();
    var collection = getCurrentCollection();
    var params = { action: 'rename-collection', name: name, collection: collection };
    $.get("operations.xql", params, function (data) {
       
        //current key
        var currentKey = $("#collection-tree-tree").dynatree("getActiveNode").data.key;
        
        //new key
        var newKey = currentKey.replace(/(.*)\/.*/, "$1/" + name);
        
        //reload the parent tree node
        refreshParentTreeNodeAndFocusOnChild(newKey);
       
        //close the dialog
        dialog.dialog("close");
    });
}

/*
    Called when the user clicks on the "move" button in the move collection dialog.
 */
function moveCollection(dialog) {
    var path = $('#move-collection-form select[name = path]').val();
    var collection = getCurrentCollection();
    var params = { action: 'move-collection', path: path, collection: collection };
    $.get("operations.xql", params, function (data) {
        
        //current key
        var currentNode = $("#collection-tree-tree").dynatree("getActiveNode");
        var currentKey = currentNode.data.key;
        
        //new key
        var newKey = path + currentKey.replace(/(.*)\//, "/");
        
        //reload the parent tree node
        refreshParentTreeNodeAndFocusOnChild(newKey);
        
        //make sure the old node is removed from the tree
        if(currentNode != null) {
            currentNode.remove();
        }
       
        //close the dialog
        dialog.dialog("close");
    });
}

/*
    Called when the user clicks on the "remove" button in the remove collection dialog.
 */
function removeCollection(dialog) {
    var collection = getCurrentCollection();
    var params = { action: 'remove-collection', collection: collection };
    $.get("operations.xql", params, function (data) {
        
        //reload the parent tree node
        refreshParentTreeNode();
       
        //close the dialog
        dialog.dialog("close");
    });
}

/*
    Called when the user clicks on the "save" button in the collection sharing dialog
 */
function updateCollectionSharing(dialog) {
    var collection = getCurrentCollection();
   
    var sharingCollectionWith = [];   
    $('input:checked[type="checkbox"][name="sharing-collection-with"]').each(function() {
        sharingCollectionWith.push($(this).val());
    });
    
    var groupList = $('#group-list').val();
    
    var groupMember = [];
    $('input:checked[type="checkbox"][name="group-member"]').each(function() {
        groupMember.push($(this).val());
    });
    
    var groupSharingPermissions = [];
    $('input:checked[type="checkbox"][name="group-sharing-permissions"]').each(function() {
        groupSharingPermissions.push($(this).val());
    });
    
    var otherSharingPermissions = [];
    $('input:checked[type="checkbox"][name="other-sharing-permissions"]').each(function() {
        otherSharingPermissions.push($(this).val());
    });
    
    var params = { "action":"update-collection-sharing", "collection":collection, "sharingCollectionWith":sharingCollectionWith, "groupList": groupList, "groupMember": groupMember, "groupSharingPermissions": groupSharingPermissions, "otherSharingPermissions": otherSharingPermissions };
    $.post("operations.xql", params, function (data) {
        //reload the tree node
        refreshCurrentTreeNode();
       
        //close the dialog
        dialog.dialog("close");
    });
}

/**
 * Called after the user clicked "Login" on the login form.
 * Checks if the supplied credentials are valid. If yes, submit
 * the form to reload the page.
 */
function login() {
    var user = $('#login-dialog input[name = user]');
    var password = $('#login-dialog input[name = password]');
    $('#login-message').text('Checking ...');
    $.ajax({
        url: "checkuser.xql",
        data: "user=" + user.val() + "&password=" + password.val(),
        type: 'GET',
        success:
            function(data, message) { 
                $('#login-form').submit(); 
            },
        error: function (response, message) { $('#login-message').html('Login failed: ' + response.responseText); }
    });
}

function newResource() {
    var collection = getCurrentCollection();
    $("#new-resource-form input[name = collection]").val(collection);
    $("#new-resource-form").submit();
}

function newRelatedResource() {
    var collection = getCurrentCollection();
    $("#add-related-form input[name = collection]").val(collection);
    $("#add-related-form").submit();
}

/**
 * Called from the create indexes dialog if the user clicks on "Start".
 */
function createIndexes() {
    var pass = $('#optimize-dialog input[name = password]');
    $('#optimize-message').text('Running ...');
    $.get('optimize.xql?pass=' + pass.val(),
        function (data, status) {
            if (status != "success")
                $('#optimize-message').text('Error during optimize!');
            else
                $('#optimize-dialog').dialog("close");
    });
}

function loadIndexTerms() {
    var input = $('input[name = input-keyword-prefix]');
    $('#keywords-result').load("filters.xql?type=keywords&prefix=" + input.val(), function () {
        if ($('#keywords-result ul').hasClass('complete'))
            $('#keyword-form').css('display', 'none');
    });
}

function autocompleteCallback(node, params) {
    var name = node.attr('name');
    var select = node.parent().parent().find('select[name ^= field]');
    if (select.length == 1) {
        params.field = select.val();
    }
}

function repeatCallback() {
    var input = $('input[name ^= input]', this);
    input.autocomplete({
        source: function(request, response) {
            var data = { term: request.term };
            autocompleteCallback(input, data);
            $.ajax({
                url: "autocomplete.xql",
                dataType: "json",
                data: data,
                success: function(data) {
                    response(data);
                }});
        },
        minLength: 3
    });

    $('select[name ^= operator]', this).each(function () {
        $(this).css('display', '');
    });
}

function saveToPersonalList(anchor){
    var img = $('img', anchor);
    var pos = anchor.hash.substring(1);
    if (img.hasClass('stored')) {
        var id = anchor.id;
        img.removeClass('stored');
        img.attr('src', '../../../resources/images/disk.gif');
        $.get('user.xql', { list: 'remove', id: id });
    } else {
        img.attr('src', '../../../resources/images/disk_gew.gif');
        img.addClass('stored');
        $.get('user.xql', { list: 'add', pos: pos });
    }
    $('#personal-list-size').load('user.xql', { action: 'count' });
    return false;
}

function resultsLoaded(options) {
    if (options.itemsPerPage > 1)
        $('tbody > tr:even > td', this).addClass('even');
    $('#filters').css('display', 'block');
    $('#filters .include-target').empty();
    $('#filters .expand').removeClass('expanded');
    
    //detail view
    $('.actions-toolbar .save', this).click(function (ev) {
        saveToPersonalList(this);
    });
    
    //list view
    $('.actions-cell .save', this).click(function (ev) {
        saveToPersonalList(this);
    });
    
    /** add remove resource action */
    $('.actions-toolbar .remove-resource', this).click(function(ev) {
        ev.preventDefault();
        $('#remove-resource-id').val($(this).attr('href').substr(1));
        $('#remove-resource-dialog').dialog('open');
    });
    
    /** add move resource action */
    $('.actions-toolbar .move-resource', this).click(function() {
        $('#move-resource-id').val($(this).attr('href').substr(1));
        $('#move-resource-dialog').dialog('open');
        return false;
    });
    
    $('.actions-toolbar .add-related', this).click(function(ev) {
        ev.preventDefault();
        var params = this.hash.substring(1).split('#');
        $('#add-related-form input[name = collection]').val(params[0]);
        $('#add-related-form input[name = host]').val(params[1]);
        $('#add-related-dialog').dialog('open');
    });
    
    //notify zotero that the dom has changed
    var ev = document.createEvent('HTMLEvents');
    ev.initEvent('ZoteroItemUpdated', true, true);
    document.dispatchEvent(ev);
}

function searchTabSelected(ev, ui) {
    if (ui.index == 3) {
        $('#personal-list-size').load('user.xql', { action: 'count' });
    }
}

//called when the collection/folder sharing dialog is opened
function updateSharingDialog() {
     
    //hide remove group button by default, may be re-enabled below if permissions are correct
    $('#remove-group-button').hide();
     
     var collection = getCurrentCollection();
     
     //load the groups and select the current group
     var params = { action: "get-groups", collection: collection };
     $.get("operations.xql", params, function(data) {
        var groups = $(data).find("groups").children();
        if(groups != null) {
        
            //clear all current entries
            var groupList = $('#group-list').find('option').remove().end();
            groupList.append('<option disabled="disabled" value=""></option>');
            
            //add entries from server
            $(groups).each(function(){
                var v = $(this).attr('id');
                var n = $(this).find('name').text();
                
                if($(this).attr('collection') != null){
                    $(groupList).append('<option selected="selected" value="' + v + '">' + n + '</option>');
                } else {
                   $(groupList).append('<option value="' + v + '">' + n + '</option>');
                }
            });
            
            //update group sharing details
            $(groups).each(function(){
                if($(this).attr('collection') != null) {
                    var groupId = $(this).attr('id');
                    updateSharingGroupMembers(groupId);
                    return false;
                }
            });
        }
     });
     
     //update other sharing details
     updateSharingOtherCheckboxes();
}

function updateSharingGroupMembers(groupId) {

    if(groupId){
        var params = { action: "get-sharing-group-members", groupId: groupId };
        $.get("operations.xql", params, function(data) {
            
            //remove any existing members
            $('#group-members-list').find('li').remove();
        
            var owner = false;
            if($(data).find('owner true').size() == 1)
            {
                owner = true;
                $('#add-new-member-to-group-button').show();
            } else if($('#group-list :selected').val() == $('#group-list :selected').text()) {
                owner = true;   //this is a new group i.e. we own it!
                $('#add-new-member-to-group-button').show();
            } else {
                $('#add-new-member-to-group-button').hide();
            }
        
            //add new members
            $(data).find('member').each(function(){
                addMemberToSharingGroupMembers($(this).text(), owner);
            });
            
            //if we are the owner of the group, we can show a button to remove the group
            var owner = $(data).find('members').attr('owner');
            if(owner != null && owner == 'true') {
                $('#remove-group-button').show();
            } else {
                $('#remove-group-button').hide();
            }
        });
        
        updateSharingGroupCheckboxes(groupId);
    } else {
        
        //if there is no group id, we cant remove the group so hide the option
        $('#remove-group-button').hide();
    }
}

function updateSharingGroupCheckboxes(groupId) {
    //set the read/write checkboxes
    var collection = getCurrentCollection();
    var params = { action: "get-group-permissions", groupId: groupId, collection: collection };
    $.get("operations.xql", params, function(data) {
        
        //set read checkbox
        var readPermissions = $(data).find('read');
        
        //set write checkbox
        var writePermissions = $(data).find('write');
        if(writePermissions.size() == 1){
            $('#group-sharing-permissions-write').get(0).checked = true;
        } else {
            $('#group-sharing-permissions-write').get(0).checked = false;
        }
        
        //set sharing checkbox
        if(readPermissions.size() + writePermissions.size() >= 1) {
            $('#sharing-collection-with-group').get(0).checked = true;
        } else {
            $('#sharing-collection-with-group').get(0).checked = false;
        }
    });
}

function updateSharingOtherCheckboxes() {
     //set the read/write checkboxes
    var collection = getCurrentCollection();
    var params = { action: "get-other-permissions", collection: collection };
    $.get("operations.xql", params, function(data) {
        
        //set read checkbox
        var readPermissions = $(data).find('read');
        
        //set write checkbox
        var writePermissions = $(data).find('write');
        if(writePermissions.size() == 1){
            $('#other-sharing-permissions-write').get(0).checked = true;
        } else {
            $('#other-sharing-permissions-write').get(0).checked = false;
        }
        
        //set sharing checkbox
        if(readPermissions.size() + writePermissions.size() >= 1) {
            $('#sharing-collection-with-other').get(0).checked = true;
        } else {
            $('#sharing-collection-with-other').get(0).checked = false;
        }
    });
}

function addMemberToSharingGroupMembers(member, isGroupOwner){

    //dont add the item if it already exists
    var currentMemberInputs = $('#group-members-list').find('input');
    for(var i = 0; i <  currentMemberInputs.size(); i++){
        if(currentMemberInputs[i].getAttribute("value") == member){
            return;
        }
    }

    //add the item
    var uuid = (new Date()).getTime();
    var li = document.createElement('li');
    
    var input = document.createElement('input');
    input.setAttribute('id', 'group-member-' + uuid);
    input.setAttribute('type', 'checkbox');
    input.setAttribute('name', 'group-member');
    input.setAttribute('value', member);
    input.setAttribute('checked', 'checked');
    if(!isGroupOwner){
        input.setAttribute('disabled', 'disabled');
    }
    
    var label = document.createElement('label');
    label.setAttribute('for', 'group-member-_' + uuid);
    label.setAttribute('class', 'labelWithCheckboxLeft');
    var memberText = document.createTextNode(member);
    label.appendChild(memberText);
    
    li.appendChild(input);
    li.appendChild(label);

   $('#group-members-list').append(li);
}

function addNewGroupToGroupList(groupName){
    
    //add the new group
    $('#group-list').append(
        $("<option></option>").attr("value", groupName).text(groupName)
    );
    
    //select the new group
    $('#group-list').val(groupName);
    
    //update the members etc
    updateSharingGroupMembers($('#group-list').val());
}

function removeGroup() {
    var answer = confirm("Whilst you are the Group owner, there may be other users reliant on this group. Are you sure you wish to remove the group?");
    if(answer) {
        var groupId = $('#group-list > option[selected = "selected"]').attr('value');
        var params = { action: "remove-group", groupId: groupId };
        $.get("operations.xql", params, function(data) {
            
            //refresh the sharing dialog
            updateSharingDialog();
        });
    }
}