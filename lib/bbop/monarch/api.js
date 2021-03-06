
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
 * java PATH/TO/RHINO/js.jar demo.js
 *
 * This loads the classes, and runs a short test
 *
 *
 * You can also experiment with functions within a REPL
 *
 */


// ========================================
// SETUP
// ========================================
if (typeof bbop == 'undefined') { var bbop = {};}
if (typeof bbop.monarch == 'undefined') { bbop.monarch = {};}

// ========================================
// ENGINE
// ========================================

/* Namespace: bbop.monarch
 * 
 * constructor for Engine object
 * 
 * Arguments:
 *  opts : associative array
 */

bbop.monarch.Engine = function(opts) {
    // Someone will have to explain to be the difference between:
    //  nif-services-stage, alpha, beta, ...
    this.config = {};

    // set defaults
    this.config.ontology_services_url = 'http://nif-services-stage.neuinfo.org/';
    this.config.federation_services_url = "http://beta.neuinfo.org/services/v1/federation/";

    // allow caller to override defaults
    if (opts != null) {
        for (k in opts) {
            this.config[k] = opts[k];
        }
    }
}

////////////////////////////////////////////////////////////////////
// 
// APPLICATION LOGIC
// 
// Anything related to genes, phenotypes, diseases and their
// connections - this is where you want to be.

/* Function: fetchDiseaseInfo
 *
 * Status: PARTIALLY IMPLEMENTED - requires doid/merged to be loaded into import chain
 *
 * Retrieves JSON block providing info about a disease
 *
 * The returned object will be the same as that for fetchClassInfo,
 * enhanced with disease-specific information
 *
 *
 * Arguments:
 *  id : An identifier. One of: IRI string, OBO-style ID or NIF-style ID
 *
 * Returns: JSON blob with info about the disease
 */
bbop.monarch.Engine.prototype.fetchDiseaseInfo = function(id, opts) {
    // every disease is represented as a class in the ontology
    var obj = this.fetchClassInfo(id);

    // TEMPORARY - we are waiting for OQ to index the disease ontology
    if (obj == null) {
        obj = {
            id: id,
            label : id
        };
    }

    // enhance this basic ontology class with cross-ontology axioms
    // for example, disease to locus (anatomy) or GO.
    // TODO - load this into monarch ontology

    // enhance this basic ontology class with data. In particular:
    //  * PHENOTYPES
    //  * GENOMIC

    // TODO - enhance this object with calls to Federation services

    var resource_id;
    var phenotype_associations = [];
    var gene_associations = [];
    var models = [];
    var alleles = [];

    // we want to fetch phenotypes from HPO annotations by keying using
    // OMIM, ORPHANET, DECIPHER IDs. Due to the way the merged DO works,
    // these *should* be the primary IDs.
    // we also might want the closure - e.g. for a generic disease,
    // get phenotypes for specific forms of this disease

    // for now, just use the entry point ID
    var disease_ids = [id];

    for each (var disease_id in disease_ids) {
        var resultObj;

        // PHENOTYPES
        resultObj = this.fetchOmimDiseasePhenotypeAsAssocations(id);
        phenotype_associations = phenotype_associations.concat(resultObj.results);

        // MODELS (currently assorted) // TODO
        resultObj = this.fetchMonarchIntegratedDiseaseModels(id);
        models = models.concat(resultObj.results);

        // GENES - DGA
        resultObj = this.fetchOmimDiseaseGeneAsAssocations(id);
        gene_associations = gene_associations.concat(resultObj.results);

        resultObj = this.fetchOmimGeneAllelePhenotypeAsAssocations(id);
        alleles = alleles.concat(resultObj.results);


    }
    obj.phenotype_associations = phenotype_associations;
    obj.gene_associations = gene_associations;
    obj.models = models;
    obj.alleles = alleles;
    
    // todo monarch


    return obj;
}


/* Function: fetchPhenotypeInfo
 *
 * Retrieves JSON block providing info about a phenotype
 *
 * Status: STUB - just diseases. No transitive closure.
 *
 * Retrieves JSON block providing info about a phenotype
 *
 * The returned object will be the same as that for fetchClassInfo,
 * enhanced with phenotype-specific information
 *
 * Arguments:
 *  id : An identifier. One of: IRI string, OBO-style ID or NIF-style ID
 *  opts : An associative array (EXTENSIBLE, OPTIONAL)
 *
 * Returns: JSON blob with info about the phenotype
 */
bbop.monarch.Engine.prototype.fetchPhenotypeInfo = function(id, opts) {
    // every phenotype is represented as a class in the ontology
    var obj = this.fetchClassInfo(id);

    // enhance this basic ontology class with cross-ontology axioms
    // for example, phenotype to GO or anatomy
    // TODO - load this into monarch ontology


    // enhance this basic ontology class with data. In particular:
    //  * DISEASE/DISORDER
    //    - OMIM diseeases by phenotype - DONE
    //  * GENOMIC
    //    - OMIM genes by phenotype
    //    - model organism genes or genotypes with this phenotype (requires uberpheno plus reasoning)

    var resource_id;
    var disease_associations = [];
    // ** OMIM **

    var resultObj = this.fetchOmimDiseasePhenotypeAsAssocations(id);

    var numResults = resultObj.resultCount; // we don't do anything with this yet
    // later on we may have disease associations from other views, not just OMIM
    obj.disease_associations = resultObj.results;

    // ** GENES **
    // TODO

    return obj;
}


/* Function: fetchGeneInfo
 *
 * Status: NOT IMPLEMENTED
 *
 * TODO - decide whether core gene info should come from ontology or federation
 *
 * Retrieves JSON block providing info about a gene
 *
 * The returned object will be the same as that for fetchClassInfo,
 * enhanced with gene-specific information
 *
 *
 * Arguments:
 *  id : An identifier. One of: IRI string, OBO-style ID or NIF-style ID
 *
 * Returns: JSON blob with info about the gene
 */
bbop.monarch.Engine.prototype.fetchGeneInfo = function(id, opts) {
    // every gene is represented as a class in the ontology (???)
    var obj = this.fetchClassInfo(id);

    // TODO - enhance this object with calls to Federation services

    return obj;
}


/* Function: fetchOmimDiseasePhenotypeAsAssocations
 *
 * Status: IMPLEMENTED
 *
 * Given a query term (e.g. an ID, either disease or phenotype), return
 * an association list object, with structure:
 *
 *     { resultCount : NUM, results: [ASSOC1, ...., ASSOCn] }
 *
 * Where ASSOC is an associative array representing a
 * disease-phenotype association with the following keys:
 *
 *  - disease : a disease structure
 *  - phenotype : a disease structure
 *  - onset
 *  - frequency
 *  - source
 *  - resource
 *
 * Both disease and phenotype structures are associative arrays keyed
 * with id and label.
 * (may be extended in future)
 *
 *
 * Arguments:
 *  id : An identifier. One of: IRI string, OBO-style ID or NIF-style ID
 *
 * Returns: JSON representing list of D-P associations
 */
bbop.monarch.Engine.prototype.fetchOmimDiseasePhenotypeAsAssocations = function(id) {

    // so obviously it would be nicer to be more declarative here abstract over
    // this a little, but this is fine to get us started
    // Example: http://beta.neuinfo.org/services/v1/federation/data/nlx_151835-1.json?includePrimaryData=true&q=HP_0003797

    // IMPORTANT NOTE: this does **not** yet do transitive closure. We would ideally like a query
    // for get-diseases-with-phentype "abnormal limb" to get diseases that effect digits, phalanges, femurs, etc.
    // this can be accomplished using the phenotype ontology.
    // We could in theory do this by querying ontoquest for the closure and then feeding all IDs in as a large
    // disjunctive query but this is not efficient or scalable. Either the federation service needs to
    // be made closure-aware OR we populate the views with the closure

    var resource_id = 'nlx_151835-1'; // HARCODE ALERT

    // translate OMIM result into generic association object
    var trOmim =
        function (r) {
            var obj = {
                disease : { id : r.disorder_id,
                            label : r.disorder_name },
                
                // in future, the phenotype may be more specific
                phenotype : { id : r.phenotype_id,
                              label : r.phenotype_label},
                
                onset : r.onset,
                frequency : r.frequency,
                
                // provenance
                source : "HPO OMIM annotations",
                resource : resource_id
            };
            return obj;
        };


    var resultObj = 
        this.fetchDataFromResource(id, 
                                   resource_id,
                                   trOmim
                                  );
    return resultObj;
}

// ?? this view is really gene-disease?
bbop.monarch.Engine.prototype.fetchOmimGenePhenotypeAsAssocations = function(id) {
    var resource_id = 'nif-0000-03216-8'; // HARCODE ALERT



    var resultObj = 
        this.fetchDataFromResource(id, 
                                   resource_id,
                                   trOmimDGA
                                  );
    return resultObj;
}

// DGA
// EXAMPLE: https://neuinfo.org/mynif/search.php?q=Smith-Lemli-Opitz%20syndrome&t=indexable&list=cover&nif=nif-0000-03216-7
bbop.monarch.Engine.prototype.fetchOmimDiseaseGeneAsAssocations = function(id) {
    var resource_id = 'nif-0000-03216-7'; // HARCODE ALERT

    // translate OMIM DiseaseGeneAssociation (DGA) result into generic association object
    var trOmimDGA =
        function (r) {
            var obj = {
                // in the DGA view "phenotype" is disease
                disease : { id : r.omim_phenotype_id,
                            label : r.omim_phenotype_name },
                
                // check: is this singular or plural
                gene : { id : r.omim_gene_ids,
                         label : r.gene_symbols},
                
                inheritance : r.omim_phenotype_inheritance,
                
                // provenance
                source : "OMIM DiseaseGene associations",
                resource : resource_id
            };
            return obj;
        };


    var resultObj = 
        this.fetchDataFromResource(id, 
                                   resource_id,
                                   trOmimDGA
                                  );
    return resultObj;

    // TODO
}

// EXAMPLE: https://beta.neuinfo.org/mynif/search.php?q=DOID_14692&t=indexable&nif=nif-0000-03216-6&b=0&r=20
bbop.monarch.Engine.prototype.fetchOmimGeneAllelePhenotypeAsAssocations = function(id) {
    var resource_id = 'nif-0000-03216-6'; // HARCODE ALERT

    // translate OMIM DiseaseGeneAssociation (DGA) result into generic association object
    var tr =
        function (r) {
            var obj = {
                // in the DGA view "phenotype" is disease
                disease : { id : r.omim_phenotype_id,
                            label : r.allele_disease_name },

                allele : { id : r.gene_allele_id,
                           link : r.gene_allele_link,
                           //xref : r.omim_allele_id,
                           xref : "dbSNP" + r.dbsnp_id,
                           mutation : r.gene_mutation,
                           label : r.gene_symbols},
                
                gene : { id : r.omim_gene_id,
                         label : r.gene_symbol},
                
                inheritance : r.omim_phenotype_inheritance,
                evidence : r.pubmed_ids,
                // provenance
                source : "OMIM DiseaseGene associations",
                resource : resource_id
            };
            return obj;
        };


    var resultObj = 
        this.fetchDataFromResource(id, 
                                   resource_id,
                                   tr
                                  );
    return resultObj;

    // TODO
}

bbop.monarch.Engine.prototype.fetchMonarchIntegratedDiseaseModels = function(id) {
    var resource_id = 'nlx_152748-1'; // HARCODE ALERT

    // translate 
    var tr =
        function (r) {
            var obj = {

                disease : { id : r.omim_id,  // todo - disease_id often blank?
                            label : r.disease_name },
                
                model : { id : r.model_id,
                          url : r.model_url,
                          label : r.clean_model_symbol, // clean? symbol or name?

                          // we model type as a distinct object
                          type : {
                              label : r.model_type,
                              parent : r.model_subtype
                          },

                          // taxon belongs to the model
                          taxon : {
                              id : r.taxon_id,
                              label : r.taxon_name,
                          }
                        }, 

                // type of association
                type : {
                    label : r.disease_model_type // e.g. asserted
                },
                
                // provenance
                source : r.annotation_source,
                resource : resource_id
            };
            return obj;
        };

    var resultObj = 
        this.fetchDataFromResource(id, 
                                   resource_id,
                                   tr
                                  );

    return resultObj;

}

////////////////////////////////////////////////////////////////////
// 
// GENERIC NIF ACCESS LAYER
//
// There should be no mention of biological entities such as genes,
// diseases etc below this point.
//
//
// May be refactored into distinct modules in the future.

/* Function: fetchClassInfo
 *
 * Retrieves JSON block providing info about an ontology class
 *
 * Services used: OntoQuest
 *
 *
 * Arguments:
 *  id : An identifier. One of: IRI string, OBO-style ID or NIF-style ID
 *
 * Returns: JSON blob representing an ontology class
 */
bbop.monarch.Engine.prototype.fetchClassInfo = function(id) {
    var nif_id = this.getNifId(id);
    var xmlStr = this.fetchUrl(this.config.ontology_services_url + 'ontoquest-lamhdi/concepts/term/' + nif_id);
    return this._translateOntoQuestXmlToJson(xmlStr);
}


/* Function: fetchDataFromResource
 *
 *
 * Services used: NIF federation call
 *
 *
 * Arguments:
 *   q : query. Arbitrary term or NIF ID
 *   resource_id : E.g. nlx_151835-1
 *   trFunction : a function to be applied to each result object which returns a transformed object
 *
 * Returns: JSON structure { resultCount : NUM, results: [ TRANSFORMED-OBJECTS ] }
 */
bbop.monarch.Engine.prototype.fetchDataFromResource = function(id, resource_id, trFunction) {
    // Example: http://beta.neuinfo.org/services/v1/federation/data/nif-0000-03216-7.json?includePrimaryData=true&q=Smith
    var nif_id = this.getNifId(id);

    var resultStr = this.fetchUrl(this.config.federation_services_url + 'data/' +  resource_id + '.json', 
                               {
                                   includePrimaryData : true, 
                                   q : nif_id
                               });
    var fedObj = JSON.parse(resultStr).result;

    if (trFunction == null) {
        // pass-through unchanged
        trFunction = function(x){return x};
    }

    var results = [];
    for each (var r in fedObj.result) {
        results.push( trFunction(r) );
    }
    var resultObj = 
        {
            resultCount : fedObj.resultCount,
            results : results
        };
    return resultObj;
}

/* Function: fetchUrl
 *
 * Generate fetch over HTTP
 *
 * In future this will abstract over base implementation: rhino vs jquery
 *
 * Arguments:
 *   url : string
 *   params :   string OR list OR dict
 *
 * Returns: string - may be JSON, XML, who knows
 */
bbop.monarch.Engine.prototype.fetchUrl = function(url, params) {
    if (params != null) {

        // be flexible in what params can be..
        if (params.map != null) {
            // params is a list of "K=V" strings
            url = url + "?" + params.join("&");
        }
        else {
            // params is a dictionary, with each value an atom or a list
            url = url + "?";
            for (k in params) {
                var vs = params[k];
                if (vs.map == null) {
                    vs = [vs];
                }
                url = url + vs.map( function(v) { return k+"="+v }).join("&") + "&";
            }
        }
    }
   return this.fetchUrlLowLevel(url); 
}

bbop.monarch.Engine.prototype.fetchUrlLowLevel = function(url) {
    //print("FETCHING: "+url);
    if (this.fetchUrlImplementation != null) {
        // API caller can provide their own URL fetching function (e.g. jQuery)
        return this.fetchUrlImplementation(url);
    }
    else {
        // defalt (rhino) URL fetching
        return readUrl(url);
    }
}

// TODO: eliminate XML and E4X dependencies and retrieve JSON from OntoQuest instead
// Depends on: https://support.crbs.ucsd.edu/browse/LAMHDI-216
bbop.monarch.Engine.prototype._translateOntoQuestXmlToJson = function(xmlStr) {

    var xml = this.parseXML(xmlStr);
    var classes = xml.data.classes;
    //print("#CLASSES: "+classes.length());
    if (classes.length() > 1) {
        this.kvetch("Expected 1 class, got " + classes);
    }
    var c = classes[0].class;
    if (c == null) {
        return null;
    }
    var info = {
        id : c.id.toString(),
        label : c.label.toString(),
        url : c.url.toString()
    };
    if (c.comments != null && c.comments[0] != null) {
        info.comments = [c.comments[0].comment.toString()];
    }
    for each (var p in c.other_properties.property) {
        var k = p.@name;
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

// This is a wrapper to deal with a known bug in E4X.
// E4X is no longer supported, but we will ditch this as
// soon as OntoQuest serves JSON
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

