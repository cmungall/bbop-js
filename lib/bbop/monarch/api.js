
/* 
 * monarch/api.js
 * 
 * Status: ALPHA
 * 
 * This API contains both *high level* calls to be used within the Monarch UI layer, as well as *lower level* calls for directly accessing
 * NIF Services - currently just OntoQuest and Federation services
 * 
 * This high level calls should abstract away from details of where information about a disease, phenotype, gene etc is stored.
 * 
 * The idea is that this application layer can live on either the server (i.e. within Rhino) or on the client.
 * Currently the status is that you MUST use Rhino whilst we are in testing phase. Some minor rewrites will be required to ise jQuery in place.
 * 
 * To test this:
 * 
 * rhino api.js
 *
 * This loads the classes, and runs a short test
 *
 * You with need a rhino script. This may be as simple as:
 *
 * #/bin/sh
 * java -jar $HOME/src/rhino/js.jar "$@" --
 *
 * You can also experiment with functions within a REPL
 *
 */

importPackage(java.io);
importPackage(Packages.org.semanticweb.owlapi.model);
importPackage(Packages.org.semanticweb.owlapi.io);
importPackage(Packages.com.google.gson);


// ========================================
// SETUP
// ========================================
if (typeof bbop == 'undefined') { var bbop = {};}
if (typeof bbop.monarch == 'undefined') { bbop.monarch = {};}

// ========================================
// ENGINE
// ========================================

/* Namespace: bbop.owl.Pachy
 * 
 * constructor
 * 
 * Arguments:
 *  ont - OWLOntology
 */

bbop.monarch.Engine = function(base_url) {
    if (base_url == null) {
        base_url = 'http://nif-services-stage.neuinfo.org/';
    }
    this.base_url = base_url;
}

///////////////////////////////////////////
// 
// APPLICATION LOGIC
// 


/* Function: fetchDiseaseInfo
 *
 * Retrieves JSON block providing info about a disease
 *
 *
 * Arguments:
 *  id : An identifier. One of: IRI string, OBO-style ID or NIF-style ID
 *
 * Returns: JSON blob with info about the disease
 */
bbop.monarch.Engine.prototype.fetchDiseaseInfo = function(id) {
    // every disease is represented as a class in the ontology
    var dis = this.fetchClassInfo(id);
}


/* Function: fetchPhenotypeInfo
 *
 * Retrieves JSON block providing info about a phenotype
 *
 *
 * Arguments:
 *  id : An identifier. One of: IRI string, OBO-style ID or NIF-style ID
 *
 * Returns: JSON blob with info about the phenotype
 */
bbop.monarch.Engine.prototype.fetchPhenotypeInfo = function(id) {
    // every phenotype is represented as a class in the ontology
    var dis = this.fetchClassInfo(id);
}


///////////////////////////////////////////
// 
// GENERIC NIF ACCESS LAYER


/* Function: fetchClassInfo
 *
 * Retrieves JSON block providing info about an ontology class
 *
 *
 * Arguments:
 *  id : An identifier. One of: IRI string, OBO-style ID or NIF-style ID
 *
 * Returns: JSON blob representing an ontology class
 */
bbop.monarch.Engine.prototype.fetchClassInfo = function(id) {
    var nif_id = this.getNifId(id);
    var xmlStr = this.fetch('ontoquest-lamhdi', 'concepts/term', nif_id);

    return this._translateXmlToJson(xmlStr);
}

// TODO: eliminate XML and E4X dependencies and retrieve JSON from OntoQuest instead
// Depends on: https://support.crbs.ucsd.edu/browse/LAMHDI-216
bbop.monarch.Engine.prototype._translateXmlToJson = function(xmlStr) {

    var xml = this.parseXML(xmlStr);
    var classes = xml.data.classes;
    print("#CLASSES: "+classes.length());
    if (classes.length() > 1) {
        this.kvetch("Expected 1 class, got " + classes);
    }
    var c = classes[0].class;
    var info = {
        id : c.id.toString(),
        label : c.label.toString(),
        url : c.url.toString()
    };
    if (c.comments != null) {
        info.comments = [c.comments[0].comment.toString()];
    }
    for each (var p in c.other_properties.property) {
        var k = p.@name;
        print(k + '=' + p.toString() );
        if (info[k] == null) {
            info[k] = [];
        }
        // if it quacks like a duck....
        if (info[k].push != null) {
            info[k].push(p.toString());
        }
    }
    return info;
}

// util
bbop.monarch.Engine.prototype.parseXML = function(s) {
     return new XML(s.replace("<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?>",""));
}

// translates an ID to a canonical form used by OntoQuest and other NIF services
bbop.monarch.Engine.prototype.getNifId = function(id) {
    if (id.indexOf("http:") == 0) {
        var parts = id.split("/");
        id = parts[parts.length-1];
    }
    if (id.indexOf(":") > -1) {
        id = id.replace(":","_");
    }
    return id;
}

bbop.monarch.Engine.prototype.fetch = function(group, service, id, params) {
    var url = this.base_url + "/" + group + "/" + service + "/" + id;
    if (params != null) {
        url = url + "?" + params.join("&");
    }
    // TODO - switch between jQuery and Rhino
    return readUrl(url);
}


function t1() {
    var e = new bbop.monarch.Engine();
    var info = e.fetchClassInfo("UBERON_0000017");
    print(JSON.stringify(info));
}
t1();
