<%@ page contentType="text/html; charset=utf-8" pageEncoding="UTF-8"%>
<% request.setCharacterEncoding("UTF-8"); %>

<%@ page import="java.util.List" %>
<%@ page import="java.util.Collection" %>

<% org.apache.solr.core.CoreContainer cores = (org.apache.solr.core.CoreContainer)request.getAttribute("org.apache.solr.CoreContainer"); %>

<html>
<head>
    
    <title>solr-admin</title>
    
    <link rel="icon" type="image/ico" href="img/favicon.ico">

    <link rel="stylesheet" type="text/css" href="css/styles/common.css">
    <link rel="stylesheet" type="text/css" href="css/styles/analysis.css">
    <link rel="stylesheet" type="text/css" href="css/styles/cloud.css">
    <link rel="stylesheet" type="text/css" href="css/styles/cores.css">
    <link rel="stylesheet" type="text/css" href="css/styles/dashboard.css">
    <link rel="stylesheet" type="text/css" href="css/styles/dataimport.css">
    <link rel="stylesheet" type="text/css" href="css/styles/index.css">
    <link rel="stylesheet" type="text/css" href="css/styles/java-properties.css">
    <link rel="stylesheet" type="text/css" href="css/styles/logging.css">
    <link rel="stylesheet" type="text/css" href="css/styles/menu.css">
    <link rel="stylesheet" type="text/css" href="css/styles/plugins.css">
    <link rel="stylesheet" type="text/css" href="css/styles/query.css">
    <link rel="stylesheet" type="text/css" href="css/styles/replication.css">
    <link rel="stylesheet" type="text/css" href="css/styles/schema-browser.css">
    <link rel="stylesheet" type="text/css" href="css/styles/threads.css">
    
    <script type="text/javascript">
    
    var app_config = {};
    
    app_config.solr_path = '<%= request.getContextPath() %>';
    app_config.core_admin_path = '<%= cores.getAdminPath() %>';
    app_config.zookeeper_path = 'zookeeper';
    app_config.schema_path = '/admin/file?file=schema.xml&contentType=text/xml;charset=utf-8';
    app_config.config_path = '/admin/file?file=solrconfig.xml&contentType=text/xml;charset=utf-8';
    
    </script>
    
</head>
<body>
    
    <div id="wrapper">
    
        <div id="header">
            
            <a href="./" id="solr"><span>Apache SOLR</span></a>

            <div id="wip-notice">
                <p>This interface is work in progress. It works best in Chrome.</p>
                <p><a href="admin">Use the <span>old admin interface</span> if there are problems with this one.</a></p>
                <p><a href="https://issues.apache.org/jira/browse/SOLR-2667">Bugs/Requests/Suggestions: <span>SOLR-2667</span></a></p>
            </div>

            <p id="environment">&nbsp;</p>

        </div>

        <div id="main" class="clearfix">
        
            <div id="content-wrapper">
            <div id="content">
                
                &nbsp;
                
            </div>
            </div>
            
            <div id="menu-wrapper">
            <div id="menu">
                
                <ul>

                    <li id="index" class="global">
                        <p><a href="#/">Dashboard</a></p>
                    </li>

                    <li id="logging" class="global">
                        <p><a href="#/logging">Logging</a></p>
                    </li>

                    <li id="cloud" class="global optional">
                        <p><a href="#/cloud">Cloud</a></p>
                    </li>

                    <li id="cores" class="global optional">
                        <p><a href="#/cores">Core Admin</a></p>
                    </li>

                    <li id="java-properties" class="global">
                        <p><a href="#/java-properties">Java Properties</a>
                    </li>

                    <li id="threads" class="global">
                        <p><a href="#/threads">Thread Dump</a></p>
                    </li>
                    
                </ul>
                
            </div>
            </div>
            
            <div id="meta">
                
                <ul>
                    
                    <li class="documentation"><a href="http://lucene.apache.org/solr/"><span>Documentation</span></a></li>
                    <li class="issues"><a href="http://issues.apache.org/jira/browse/SOLR"><span>Issue Tracker</span></a></li>
                    <li class="irc"><a href="http://webchat.freenode.net/?channels=#solr"><span>IRC Channel</span></a></li>
                    <li class="mailinglist"><a href="http://wiki.apache.org/solr/UsingMailingLists"><span>Community forum</span></a></li>
                    <li class="wiki-query-syntax"><a href="http://wiki.apache.org/solr/SolrQuerySyntax"><span>Solr Query Syntax</span></a></li>
                    
                </ul>
                
            </div>
            
        </div>
    
    </div>
    
    <script src="js/require.js" data-main="js/main"></script>

</body>
</html>