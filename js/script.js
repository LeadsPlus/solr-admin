var loader = {
    
    show : function( element )
    {
        $( element )
            .addClass( 'loader' );
    },
    
    hide : function( element )
    {
        $( element )
            .removeClass( 'loader' );
    }
    
};

var sammy = $.sammy
(
    function()
    {
        this.bind
        (
            'run',
            function( event, config )
            {
                if( 0 === config.start_url.length )
                {
                    location.href = '#/';
                    return false;
                }
            }
        );
        
        this.bind
        (
            'ping',
            function( event )
            {
                var element = $( this.params.element );
                
                $.ajax
                (
                    {
                        url : element.attr( 'href' ) + '?wt=json',
                        dataType : 'json',
                        beforeSend : function( arr, form, options )
                        {
                            loader.show( element );
                        },
                        success : function( response )
                        {
                            var qtime_element = $( '.qtime', element );
                            
                            if( 0 === qtime_element.size() )
                            {
                                qtime_element = $( '<small class="qtime"> (<span></span>)</small>' );
                                
                                element
                                    .append
                                    (
                                        qtime_element
                                    );
                            }
                            
                            $( 'span', qtime_element )
                                .html( response.responseHeader.QTime + 'ms' );
                        },
                        error : function()
                        {
                        },
                        complete : function()
                        {
                            loader.hide( element );
                        }
                    }
                );
                
                return false;
            }
        );
        
        // activate_core
        this.before
        (
            {},
            function()
            {
                $( 'li[id].active', app.menu_element )
                    .removeClass( 'active' );
                
                $( 'ul li.active', app.menu_element )
                    .removeClass( 'active' );

                if( this.params.splat )
                {
                    this.active_core = $( '#' + this.params.splat[0], app.menu_element );
                    
                    this.active_core
                        .addClass( 'active' );

                    if( this.params.splat[1] )
                    {
                        $( '.' + this.params.splat[1], this.active_core )
                            .addClass( 'active' );
                    }
                }
            }
        );

        // #/logging
        this.get
        (
            /^#\/logging$/,
            function( context )
            {
                var content_element = $( '#content' );

                $( '#logging', app.menu_element )
                    .addClass( 'active' );
                
                content_element
                    .html( '<div id="logging"></div>' );

                $.ajax
                (
                    {
                        url : 'logging.json',
                        dataType : 'json',
                        context : $( '#logging', content_element ),
                        beforeSend : function( xhr, settings )
                        {
                            this
                                .html( '<div class="loader">Loading ...</div>' );
                        },
                        success : function( response, text_status, xhr )
                        {
                            var logger = response.logger;

                            var loglevel = '<div class="loglevel %class%">' + "\n";
                            loglevel += '<a class="effective_level trigger"><span>%effective_level%</span></a>' + "\n";
                            loglevel += '<ul>' + "\n";

                            for( var key in response.levels )
                            {
                                var level = response.levels[key];
                                loglevel += '<li class="' + level + '"><a>' + level + '</a></li>' + "\n";
                            }

                            loglevel += '<li class="UNSET"><a>UNSET</a></li>' + "\n";
                            loglevel += '</ul>' + "\n";
                            loglevel += '</div>';

                            var logger_tree = function( filter )
                            {
                                var logger_content = '';
                                var filter_regex = new RegExp( '^' + filter + '\\.\\w+$' );

                                for( var logger_name in logger )
                                {
                                    var continue_matcher = false;

                                    if( !filter )
                                    {
                                        continue_matcher = logger_name.indexOf( '.' ) !== -1;
                                    }
                                    else
                                    {
                                        continue_matcher = !logger_name.match( filter_regex );
                                    }

                                    if( continue_matcher )
                                    {
                                        continue;
                                    }

                                    var has_logger_instance = !!logger[logger_name];

                                    var classes = [];

                                    has_logger_instance
                                        ? classes.push( 'active' )
                                        : classes.push( 'inactive' );

                                    logger_content += '<li class="jstree-leaf">';
                                    logger_content += '<ins class="jstree-icon">&nbsp;</ins>';
                                    logger_content += '<a class="trigger ' + classes.join( ' ' ) + '" ' + "\n" +
                                                         'title="' + logger_name + '"><span>' + "\n" +
                                                        logger_name.split( '.' ).pop() + "\n" +
                                                      '</span></a>';

                                    logger_content += loglevel
                                                        .replace
                                                        (
                                                            /%class%/g,
                                                            classes.join( ' ' )
                                                        )
                                                        .replace
                                                        (
                                                            /%effective_level%/g,
                                                            has_logger_instance
                                                                ? logger[logger_name].effective_level
                                                                : 'null'
                                                        );

                                    var child_logger_content = logger_tree( logger_name );
                                    if( child_logger_content )
                                    {
                                        logger_content += '<ul>';
                                        logger_content += child_logger_content;
                                        logger_content += '</ul>';
                                    }

                                    logger_content += '</li>';
                                }

                                return logger_content;
                            }

                            var logger_content = logger_tree( null );

                            this
                                .html( '<ul class="tree jstree">' + logger_content + '</ul>' );

                            $( 'li:last-child', this )
                                .addClass( 'jstree-last' );
                            
                            $( '.loglevel', this )
                                .each
                                (
                                    function( index, element )
                                    {
                                        var element = $( element );
                                        var effective_level = $( '.effective_level span', element ).html();

                                        element
                                            .css( 'z-index', 800 - index );
                                        
                                        $( 'ul .' + effective_level, element )
                                            .addClass( 'selected' );
                                    }
                                );

                            $( '.trigger', this )
                                .die( 'click' )
                                .live
                                (
                                    'click',
                                    function( event )
                                    {
                                        $( '.loglevel', $( this ).parents( 'li' ).first() ).first()
                                            .trigger( 'toggle' );
                                    }
                                );
                            
                            $( '.loglevel', this )
                                .die( 'toggle')
                                .live
                                (
                                    'toggle',
                                    function( event )
                                    {
                                        $( this )
                                            .toggleClass( 'open' );
                                    }
                                );
                        },
                        error : function( xhr, text_status, error_thrown)
                        {
                        },
                        complete : function( xhr, text_status )
                        {
                        }
                    }
                );
            }
        );

        // #/java-properties
        this.get
        (
            /^#\/(java-properties)$/,
            function( context )
            {
                var content_element = $( '#content' );

                $( '#java-properties', app.menu_element )
                    .addClass( 'active' );

                content_element
                    .html( '<div id="java-properties"></div>' );

                $.ajax
                (
                    {
                        url : app.config.java_properties_path,
                        dataType : 'json',
                        context : $( '#java-properties', content_element ),
                        beforeSend : function( xhr, settings )
                        {
                            this
                                .html( '<div class="loader">Loading ...</div>' );
                        },
                        success : function( response, text_status, xhr )
                        {
                            var properties_data = {};
                            var properties_content = [];
                            var properties_order = [];

                            delete response['_dummy'];
                            for( var key in response )
                            {
                                var displayed_key = key.replace( /\./g, '.&#8203;' );
                                var displayed_value = [ response[key] ];
                                var item_class = 'clearfix';

                                if( -1 !== key.indexOf( '.path' ) )
                                {
                                    displayed_value = response[key].split( ':' );
                                    if( 1 < displayed_value.length )
                                    {
                                        item_class += ' multi';
                                    }
                                }

                                var item_content = '<li><dl class="' + item_class + '">' + "\n" +
                                                   '<dt>' + displayed_key + '</dt>' + "\n";

                                for( var i in displayed_value )
                                {
                                    item_content += '<dd>' + displayed_value[i] + '</dd>' + "\n";
                                }

                                item_content += '</dl></li>';

                                properties_data[key] = item_content;
                                properties_order.push( key );
                            }

                            properties_order.sort();
                            for( var i in properties_order )
                            {
                                properties_content.push( properties_data[properties_order[i]] );
                            }

                            this
                                .html( '<ul>' + properties_content.join( "\n" ) + '</ul>' );
                            
                            $( 'li:odd', this )
                                .addClass( 'odd' );
                            
                            $( '.multi dd:odd', this )
                                .addClass( 'odd' );
                        },
                        error : function( xhr, text_status, error_thrown)
                        {
                        },
                        complete : function( xhr, text_status )
                        {
                        }
                    }
                );
            }
        );

        // #/threads
        this.get
        (
            /^#\/(threads)$/,
            function( context )
            {
                var core_basepath = $( 'li[data-basepath]', app.menu_element ).attr( 'data-basepath' );
                var content_element = $( '#content' );

                $( '#threads', app.menu_element )
                    .addClass( 'active' );

                $.get
                (
                    'tpl/threads.html',
                    function( template )
                    {
                        content_element
                            .html( template );

                        $.ajax
                        (
                            {
                                url : core_basepath + '/admin/threads?wt=json',
                                dataType : 'json',
                                context : $( '#threads', content_element ),
                                beforeSend : function( xhr, settings )
                                {
                                },
                                success : function( response, text_status, xhr )
                                {
                                    var threadDumpData = response.system.threadDump;
                                    var threadDumpContent = [];
                                    var c = 0;
                                    for( var i = 1; i < threadDumpData.length; i += 2 )
                                    {
                                        var state = threadDumpData[i].state;
                                        var name = '<a><span>' + threadDumpData[i].name + '</span></a>';

                                        var class = [state];
                                        var details = '';

                                        if( 0 !== c % 2 )
                                        {
                                            class.push( 'odd' );
                                        }

                                        if( threadDumpData[i].lock )
                                        {
                                            class.push( 'lock' );
                                            name += "\n" + '<p title="Waiting on">' + threadDumpData[i].lock + '</p>';
                                        }

                                        if( threadDumpData[i].stackTrace && 0 !== threadDumpData[i].stackTrace.length )
                                        {
                                            class.push( 'stacktrace' );

                                            var stack_trace = threadDumpData[i].stackTrace
                                                                .join( '</li><li>' )
                                                                .replace( /\(/g, '&#8203;(' );

                                            name += '<div>' + "\n"
                                                    + '<ul>' + "\n"
                                                    + '<li>' + stack_trace + '</li>'
                                                    + '</ul>' + "\n"
                                                    + '</div>';
                                        }

                                        var item = '<tr class="' + class.join( ' ' ) +'">' + "\n"

                                                 + '<td class="ico" title="' + state +'"><span>' + state +'</span></td>' + "\n"
                                                 + '<td class="id">' + threadDumpData[i].id + '</td>' + "\n"
                                                 + '<td class="name">' + name + '</td>' + "\n"
                                                 + '<td class="time">' + threadDumpData[i].cpuTime + '</td>' + "\n"
                                                 + '<td class="time">' + threadDumpData[i].userTime + '</td>' + "\n"

                                                 + '</tr>';
                                        
                                        threadDumpContent.push( item );
                                        c++;
                                    }

                                    var threadDumpBody = $( '#thread-dump tbody', this );

                                    threadDumpBody
                                        .html( threadDumpContent.join( "\n" ) );
                                    
                                    $( '.name a', threadDumpBody )
                                        .die( 'click' )
                                        .live
                                        (
                                            'click',
                                            function( event )
                                            {
                                                $( this ).closest( 'tr' )
                                                    .toggleClass( 'open' );
                                            }
                                        )
                                },
                                error : function( xhr, text_status, error_thrown)
                                {
                                },
                                complete : function( xhr, text_status )
                                {
                                }
                            }
                        );
                    }
                );
            }
        );

        this.bind
        (
            'schema_browser_navi',
            function( event, params )
            {
                var related_navigation_element = $( '#related dl', params.schema_browser_element );
                var related_select_element = $( '#related select', params.schema_browser_element )
                var type = 'index';

                if( !params.route_params )
                {
                    related_navigation_element
                        .hide();
                    
                    $( 'option:selected', related_select_element )
                        .removeAttr( 'selected' );
                }
                else
                {
                    var type = params.route_params.splat[3];
                    var value = params.route_params.splat[4];

                    var navigation_data = {
                        'fields' : [],
                        'copyfield_source' : [],
                        'copyfield_dest' : [],
                        'dynamic_fields' : [],
                        'types' : []
                    }

                    $( 'option[value=' + params.route_params.splat[2] + ']', related_select_element )
                        .attr( 'selected', 'selected' );

                    if( 'field' === type )
                    {
                        navigation_data.fields.push( value );
                        navigation_data.types.push( app.schema_browser_data.relations.f_t[value] );

                        if( app.schema_browser_data.relations.f_df[value] )
                        {
                            navigation_data.dynamic_fields.push( app.schema_browser_data.relations.f_df[value] );
                        }

                        if( 0 !== app.schema_browser_data.fields[value].copySources.length )
                        {
                            navigation_data.copyfield_source = app.schema_browser_data.fields[value].copySources;
                        }

                        if( 0 !== app.schema_browser_data.fields[value].copyDests.length )
                        {
                            navigation_data.copyfield_dest = app.schema_browser_data.fields[value].copyDests;
                        }
                    }
                    else if( 'dynamic-field' === type )
                    {
                        navigation_data.dynamic_fields.push( value );
                        navigation_data.types.push( app.schema_browser_data.relations.df_t[value] );

                        if( app.schema_browser_data.relations.df_f[value] )
                        {
                            navigation_data.fields = app.schema_browser_data.relations.df_f[value];
                        }
                    }
                    else if( 'type' === type )
                    {
                        navigation_data.types.push( value );
                        
                        if( app.schema_browser_data.relations.t_f[value] )
                        {
                            navigation_data.fields = app.schema_browser_data.relations.t_f[value];
                        }
                        
                        if( app.schema_browser_data.relations.t_df[value] )
                        {
                            navigation_data.dynamic_fields = app.schema_browser_data.relations.t_df[value];
                        }
                    }

                    var sammy_basepath = '#/' + $( 'p a', params.active_core ).html() + '/schema-browser';
                    var navigation_content = '';

                    if( 0 !== navigation_data.fields.length )
                    {
                        navigation_data.fields.sort();
                        navigation_content += '<dt class="field">Fields</dt>' + "\n";
                        for( var i in navigation_data.fields )
                        {
                            var href = sammy_basepath + '/field/' + navigation_data.fields[i];
                            navigation_content += '<dd class="field"><a href="' + href + '">' + 
                                                  navigation_data.fields[i] + '</a></dd>' + "\n";
                        }
                    }

                    if( 0 !== navigation_data.copyfield_source.length )
                    {
                        navigation_data.copyfield_source.sort();
                        navigation_content += '<dt class="copyfield">Copied from</dt>' + "\n";
                        for( var i in navigation_data.copyfield_source )
                        {
                            var href = sammy_basepath + '/field/' + navigation_data.copyfield_source[i];
                            navigation_content += '<dd class="copyfield"><a href="' + href + '">' + 
                                                  navigation_data.copyfield_source[i] + '</a></dd>' + "\n";
                        }
                    }

                    if( 0 !== navigation_data.copyfield_dest.length )
                    {
                        navigation_data.copyfield_dest.sort();
                        navigation_content += '<dt class="copyfield">Copied to</dt>' + "\n";
                        for( var i in navigation_data.copyfield_dest )
                        {
                            var href = sammy_basepath + '/field/' + navigation_data.copyfield_dest[i];
                            navigation_content += '<dd class="copyfield"><a href="' + href + '">' + 
                                                  navigation_data.copyfield_dest[i] + '</a></dd>' + "\n";
                        }
                    }

                    if( 0 !== navigation_data.dynamic_fields.length )
                    {
                        navigation_data.dynamic_fields.sort();
                        navigation_content += '<dt class="dynamic-field">Dynamic Fields</dt>' + "\n";
                        for( var i in navigation_data.dynamic_fields )
                        {
                            var href = sammy_basepath + '/dynamic-field/' + navigation_data.dynamic_fields[i];
                            navigation_content += '<dd class="dynamic-field"><a href="' + href + '">' + 
                                                  navigation_data.dynamic_fields[i] + '</a></dd>' + "\n";
                        }
                    }

                    if( 0 !== navigation_data.types.length )
                    {
                        navigation_data.types.sort();
                        navigation_content += '<dt class="type">Types</dt>' + "\n";
                        for( var i in navigation_data.types )
                        {
                            var href = sammy_basepath + '/type/' + navigation_data.types[i];
                            navigation_content += '<dd class="type"><a href="' + href + '">' + 
                                                  navigation_data.types[i] + '</a></dd>' + "\n";
                        }
                    }

                    related_navigation_element
                        .show()
                        .attr( 'class', type )
                        .html( navigation_content );
                }

                $.get
                (
                        'tpl/schema-browser_'+ type + '.html',
                    function( template )
                    {
                        var data_element = $( '#data', params.schema_browser_element );
                    
                        data_element
                            .html( template );

                        params.callback( app.schema_browser_data, data_element );
                    }
                );
            }
        );

        this.bind
        (
            'schema_browser_load',
            function( event, params )
            {
                var core_basepath = params.active_core.attr( 'data-basepath' );
                var content_element = $( '#content' );

                if( app.schema_browser_data )
                {
                    params.schema_browser_element = $( '#schema-browser', content_element );

                    sammy.trigger
                    (
                        'schema_browser_navi',
                        params
                    );
                }
                else
                {
                    content_element
                        .html( '<div id="schema-browser"><div class="loader">Loading ...</div></div>' );
                    
                    $.ajax
                    (
                        {
                            url : core_basepath + '/admin/luke?numTerms=50&wt=json',
                            dataType : 'json',
                            beforeSend : function( xhr, settings )
                            {
                            },
                            success : function( response, text_status, xhr )
                            {
                                app.schema_browser_data = {
                                    default_search_field : null,
                                    unique_key_field : null,
                                    key : {},
                                    fields : {},
                                    dynamic_fields : {},
                                    types : {},
                                    relations : {
                                        f_df : {},
                                        f_t  : {},
                                        df_f : {},
                                        df_t : {},
                                        t_f  : {},
                                        t_df : {}
                                    }
                                };

                                app.schema_browser_data.fields = response.fields;
                                app.schema_browser_data.key = response.info.key;

                                $.ajax
                                (
                                    {
                                        url : core_basepath + '/admin/luke?show=schema&wt=json',
                                        dataType : 'json',
                                        beforeSend : function( xhr, settings )
                                        {
                                        },
                                        success : function( response, text_status, xhr )
                                        {
                                            app.schema_browser_data.default_search_field = response.schema.defaultSearchField;
                                            app.schema_browser_data.unique_key_field = response.schema.uniqueKeyField;

                                            app.schema_browser_data.dynamic_fields = response.schema.dynamicFields;
                                            app.schema_browser_data.types = response.schema.types;

                                            var luke_array_to_struct = function( array )
                                            {
                                                var struct = {
                                                    keys : [],
                                                    values : []
                                                };
                                                for( var i = 0; i < array.length; i += 2 )
                                                {
                                                    struct.keys.push( array[i] );
                                                    struct.values.push( array[i+1] );
                                                }
                                                return struct;
                                            }

                                            var luke_array_to_hash = function( array )
                                            {
                                                var hash = {};
                                                for( var i = 0; i < array.length; i += 2 )
                                                {
                                                    hash[ array[i] ] = array[i+1];
                                                }
                                                return hash;
                                            }

                                            for( var field in response.schema.fields )
                                            {
                                                app.schema_browser_data.fields[field] = $.extend
                                                (
                                                    {},
                                                    app.schema_browser_data.fields[field],
                                                    response.schema.fields[field]
                                                );
                                            }

                                            for( var field in app.schema_browser_data.fields )
                                            {
                                                app.schema_browser_data.fields[field].copySourcesRaw = null;

                                                if( app.schema_browser_data.fields[field].copySources &&
                                                    0 !== app.schema_browser_data.fields[field].copySources.length )
                                                {
                                                    app.schema_browser_data.fields[field].copySourcesRaw =
                                                        app.schema_browser_data.fields[field].copySources;
                                                }
                                                
                                                app.schema_browser_data.fields[field].copyDests = [];
                                                app.schema_browser_data.fields[field].copySources = [];
                                            }

                                            for( var field in app.schema_browser_data.fields )
                                            {
                                                if( app.schema_browser_data.fields[field].histogram )
                                                {
                                                    var histogram = app.schema_browser_data.fields[field].histogram;

                                                    app.schema_browser_data.fields[field].histogram = 
                                                        luke_array_to_struct( histogram );
                                                    
                                                    app.schema_browser_data.fields[field].histogram_hash = 
                                                        luke_array_to_hash( histogram );
                                                }

                                                if( app.schema_browser_data.fields[field].topTerms )
                                                {
                                                    var top_terms = app.schema_browser_data.fields[field].topTerms;

                                                    app.schema_browser_data.fields[field].topTerms = 
                                                        luke_array_to_struct( top_terms );

                                                    app.schema_browser_data.fields[field].topTerms_hash = 
                                                        luke_array_to_hash( top_terms );
                                                }

                                                if( app.schema_browser_data.fields[field].copySourcesRaw )
                                                {
                                                    var copy_sources = app.schema_browser_data.fields[field].copySourcesRaw;
                                                    for( var i in copy_sources )
                                                    {
                                                        var target = copy_sources[i].replace( /^.+:(.+)\{.+$/, '$1' );

                                                        app.schema_browser_data.fields[field].copySources.push( target );
                                                        app.schema_browser_data.fields[target].copyDests.push( field );
                                                    }
                                                }

                                                app.schema_browser_data.relations.f_t[field] = app.schema_browser_data.fields[field].type;

                                                if( !app.schema_browser_data.relations.t_f[app.schema_browser_data.fields[field].type] )
                                                {
                                                    app.schema_browser_data.relations.t_f[app.schema_browser_data.fields[field].type] = [];
                                                }
                                                app.schema_browser_data.relations.t_f[app.schema_browser_data.fields[field].type].push( field );

                                                if( app.schema_browser_data.fields[field].dynamicBase )
                                                {
                                                    app.schema_browser_data.relations.f_df[field] = app.schema_browser_data.fields[field].dynamicBase;

                                                    if( !app.schema_browser_data.relations.df_f[app.schema_browser_data.fields[field].dynamicBase] )
                                                    {
                                                        app.schema_browser_data.relations.df_f[app.schema_browser_data.fields[field].dynamicBase] = [];
                                                    }
                                                    app.schema_browser_data.relations.df_f[app.schema_browser_data.fields[field].dynamicBase].push( field );
                                                }
                                            }

                                            for( var dynamic_field in app.schema_browser_data.dynamic_fields )
                                            {
                                                app.schema_browser_data.relations.df_t[dynamic_field] = app.schema_browser_data.dynamic_fields[dynamic_field].type;

                                                if( !app.schema_browser_data.relations.t_df[app.schema_browser_data.dynamic_fields[dynamic_field].type] )
                                                {
                                                    app.schema_browser_data.relations.t_df[app.schema_browser_data.dynamic_fields[dynamic_field].type] = [];
                                                }
                                                app.schema_browser_data.relations.t_df[app.schema_browser_data.dynamic_fields[dynamic_field].type].push( dynamic_field );
                                            }

                                            $.get
                                            (
                                                'tpl/schema-browser.html',
                                                function( template )
                                                {
                                                    content_element
                                                        .html( template );
                                                    
                                                    var schema_browser_element = $( '#schema-browser', content_element );
                                                    var related_element = $( '#related', schema_browser_element );
                                                    var related_select_element = $( 'select', related_element );
                                                    var data_element = $( '#data', schema_browser_element );

                                                    var related_options = '';
                                                    
                                                    var fields = [];
                                                    for( var field_name in app.schema_browser_data.fields )
                                                    {
                                                        fields.push
                                                        (
                                                            '<option value="/field/' + field_name + '">' + field_name + '</option>'
                                                        );
                                                    }
                                                    if( 0 !== fields.length )
                                                    {
                                                        fields.sort();
                                                        related_options += '<optgroup label="Fields">' + "\n";
                                                        related_options += fields.join( "\n" ) + "\n";
                                                        related_options += '</optgroup>' + "\n";
                                                    }
                                                    
                                                    var dynamic_fields = [];
                                                    for( var type_name in app.schema_browser_data.dynamic_fields )
                                                    {
                                                        dynamic_fields.push
                                                        (
                                                            '<option value="/dynamic-field/' + type_name + '">' + type_name + '</option>'
                                                        );
                                                    }
                                                    if( 0 !== dynamic_fields.length )
                                                    {
                                                        dynamic_fields.sort();
                                                        related_options += '<optgroup label="DynamicFields">' + "\n";
                                                        related_options += dynamic_fields.join( "\n" ) + "\n";
                                                        related_options += '</optgroup>' + "\n";
                                                    }
                                                    
                                                    var types = [];
                                                    for( var type_name in app.schema_browser_data.types )
                                                    {
                                                        types.push
                                                        (
                                                            '<option value="/type/' + type_name + '">' + type_name + '</option>'
                                                        );
                                                    }
                                                    if( 0 !== types.length )
                                                    {
                                                        types.sort();
                                                        related_options += '<optgroup label="Types">' + "\n";
                                                        related_options += types.join( "\n" ) + "\n";
                                                        related_options += '</optgroup>' + "\n";
                                                    }

                                                    related_select_element
                                                        .attr( 'rel', '#/' + $( 'p a', params.active_core ).html() + '/schema-browser' )
                                                        .append( related_options );
                                                    
                                                    related_select_element
                                                        .die( 'change' )
                                                        .live
                                                        (
                                                            'change',
                                                            function( event )
                                                            {
                                                                var select_element = $( this );
                                                                var option_element = $( 'option:selected', select_element );

                                                                location.href = select_element.attr( 'rel' ) + option_element.val();
                                                                return false;
                                                            }
                                                        );

                                                    params.schema_browser_element = schema_browser_element;
                                                    sammy.trigger
                                                    (
                                                        'schema_browser_navi',
                                                        params
                                                    );
                                                }
                                            );
                                        },
                                        error : function( xhr, text_status, error_thrown)
                                        {
                                        },
                                        complete : function( xhr, text_status )
                                        {
                                        }
                                    }
                                );

                            },
                            error : function( xhr, text_status, error_thrown)
                            {
                            },
                            complete : function( xhr, text_status )
                            {
                            }
                        }
                    );
                }
            }
        );

        // #/:core/schema-browser
        this.get
        (
            /^#\/([\w\d]+)\/(schema-browser)$/,
            function( context )
            {
                var callback = function( schema_browser_data, data_element )
                {
                    var sammy_basepath = '#/' + $( 'p a', context.active_core ).html() + '/schema-browser'

                    if( schema_browser_data.unique_key_field )
                    {
                        $( '.unique-key-field', data_element )
                            .show()
                            .after( '<dd><a href="' + sammy_basepath + '/field/' + schema_browser_data.unique_key_field + '">' + schema_browser_data.unique_key_field + '</a></dd>' );
                    }

                    if( schema_browser_data.default_search_field )
                    {
                        $( '.default-search-field', data_element )
                            .show()
                            .after( '<dd><a href="' + sammy_basepath + '/field/' + schema_browser_data.default_search_field + '">' + schema_browser_data.default_search_field + '</a></dd>' );
                    }
                }

                sammy.trigger
                (
                    'schema_browser_load',
                    {
                        callback : callback,
                        active_core : this.active_core
                    }
                );
            }
        );

        // #/:core/schema-browser/field/$field
        this.get
        (
            /^#\/([\w\d]+)\/(schema-browser)(\/(field)\/(.+))$/,
            function( context )
            {
                var callback = function( schema_browser_data, data_element )
                {
                    var field = context.params.splat[4];
                    
                    var options_element = $( '.options', data_element );
                    var sammy_basepath = '#/' + $( 'p a', context.active_core ).html() + '/schema-browser'

                    var keystring_to_list = function( keystring )
                    {
                        var key_list = keystring.replace( /-/g, '' ).split( '' );
                        var list = [];

                        for( var i in key_list )
                        {
                            var option_key = schema_browser_data.key[key_list[i]];

                            if( !option_key )
                            {
                                option_key = schema_browser_data.key[key_list[i].toLowerCase()];
                            }

                            if( !option_key )
                            {
                                option_key = schema_browser_data.key[key_list[i].toUpperCase()];
                            }

                            if( option_key )
                            {
                                list.push( '<dd>' + option_key + ',</dd>' );
                            }
                        }

                        list[list.length-1] = list[key_list.length-1].replace( /,/, '' );

                        return list;
                    }

                    // -- properties
                    if( schema_browser_data.fields[field].flags )
                    {
                        var properties_element = $( '.properties', options_element );
                        var properties_keys = keystring_to_list( schema_browser_data.fields[field].flags );

                        properties_element
                            .show()
                            .after( properties_keys.join( "\n" ) );
                    }

                    // -- schema
                    if( schema_browser_data.fields[field].schema )
                    {
                        var schema_element = $( '.schema', options_element );
                        var schema_keys = keystring_to_list( schema_browser_data.fields[field].schema );

                        schema_element
                            .show()
                            .after( schema_keys.join( "\n" ) );
                    }

                    // -- index
                    if( schema_browser_data.fields[field].index )
                    {
                        var index_element = $( '.index', options_element );
                        var index_keys = [];

                        if( 0 === schema_browser_data.fields[field].index.indexOf( '(' ) )
                        {
                            index_keys.push( '<dd>' + schema_browser_data.fields[field].index + '</dd>' );
                        }
                        else
                        {
                            index_keys = keystring_to_list( schema_browser_data.fields[field].index );
                        }

                        index_element
                            .show()
                            .after( index_keys.join( "\n" ) );
                    }

                    // -- docs
                    if( schema_browser_data.fields[field].docs )
                    { 
                        var docs_element = $( '.docs', options_element );

                        docs_element
                            .show()
                            .after( '<dd>' + schema_browser_data.fields[field].docs + '</dd>' );
                    }

                    // -- distinct 
                    if( schema_browser_data.fields[field].distinct )
                    {
                        var distinct_element = $( '.distinct', options_element );

                        distinct_element
                            .show()
                            .after( '<dd>' + schema_browser_data.fields[field].distinct + '</dd>' );
                    }

                    // -- position-increment-gap 
                    if( schema_browser_data.fields[field].positionIncrementGap )
                    {
                        var pig_element = $( '.position-increment-gap', options_element );

                        pig_element
                            .show()
                            .after( '<dd>' + schema_browser_data.fields[field].positionIncrementGap + '</dd>' );
                    }

                    var analyzer_data = schema_browser_data.types[schema_browser_data.relations.f_t[field]];
                    var analyzer_element = $( '.analyzer', data_element );

                    var transform_analyzer_data_into_list = function( analyzer_data )
                    {
                        var args = [];
                        for( var key in analyzer_data.args )
                        {
                            var arg_class = '';
                            var arg_content = '';

                            if( 'true' === analyzer_data.args[key] || '1' === analyzer_data.args[key] )
                            {
                                arg_class = 'ico-1';
                                arg_content = key;
                            }
                            else if( 'false' === analyzer_data.args[key] || '0' === analyzer_data.args[key] )
                            {
                                arg_class = 'ico-0';
                                arg_content = key;
                            }
                            else
                            {
                                arg_content = key + ': ';

                                if( 'synonyms' === key || 'words' === key )
                                {
                                    // @TODO: set link target for file
                                    arg_content += '<a>' + analyzer_data.args[key] + '</a>';
                                }
                                else
                                {
                                    arg_content += analyzer_data.args[key];
                                }
                            }

                            args.push( '<dd class="' + arg_class + '">' + arg_content + '</dd>' );
                        }

                        var list_content = '<dt>' + analyzer_data.className + '</dt>';
                        if( 0 !== args.length )
                        {
                            args.sort();
                            list_content += args.join( "\n" );
                        }

                        return list_content;
                    }

                    // -- field-type
                    var field_type_element = $( '.field-type', options_element );

                    field_type_element
                        .show()
                        .after( '<dd>' + analyzer_data.className + '</dd>' );


                    for( var key in analyzer_data )
                    {
                        var key_match = key.match( /^(.+)Analyzer$/ );
                        if( !key_match )
                        {
                            continue;
                        }

                        var analyzer_key_element = $( '.' + key_match[1], analyzer_element );
                        var analyzer_key_data = analyzer_data[key];

                        analyzer_element.show();
                        analyzer_key_element.show();

                        if( analyzer_key_data.className )
                        {
                            $( 'dl:first dt', analyzer_key_element )
                                .html( analyzer_key_data.className );
                        }

                        for( var type in analyzer_key_data )
                        {
                            if( 'object' !== typeof analyzer_key_data[type] )
                            {
                                continue;
                            }

                            var type_element = $( '.' + type, analyzer_key_element );
                            var type_content = [];

                            type_element.show();

                            if( analyzer_key_data[type].className )
                            {
                                type_content.push( transform_analyzer_data_into_list( analyzer_key_data[type] ) );
                            }
                            else
                            {
                                for( var entry in analyzer_key_data[type] )
                                {
                                    type_content.push( transform_analyzer_data_into_list( analyzer_key_data[type][entry] ) );
                                }
                            }

                            $( 'dl', type_element )
                                .append( type_content.join( "\n" ) );
                        }
                    }


                    var topterms_holder_element = $( '.topterms-holder', data_element );
                    if( !schema_browser_data.fields[field].topTerms_hash )
                    {
                        topterms_holder_element
                            .hide();
                    }
                    else
                    {
                        topterms_holder_element
                            .show();

                        var topterms_table_element = $( 'table', topterms_holder_element );

                        var topterms_navi_less = $( 'p.navi .less', topterms_holder_element );
                        var topterms_navi_more = $( 'p.navi .more', topterms_holder_element );

                        var topterms_count = schema_browser_data.fields[field].topTerms.keys.length; 
                        var topterms_hash = schema_browser_data.fields[field].topTerms_hash;
                        var topterms_content = '<tbody>';

                        var i = 1;
                        for( var term in topterms_hash )
                        {
                            topterms_content += '<tr>' + "\n" +
                                                '<td class="position">' + i + '</td>' + "\n" + 
                                                '<td class="term">' + term + '</td>' + "\n" + 
                                                '<td class="frequency">' + topterms_hash[term] + '</td>' + "\n" + 
                                                '</tr>' + "\n";

                            if( i !== topterms_count && 0 === i % 10 )
                            {
                                topterms_content += '</tbody><tbody>';
                            }

                            i++;
                        }

                        topterms_content += '</tbody>';

                        topterms_table_element
                            .append( topterms_content );
                        
                        $( 'tbody', topterms_table_element )
                            .die( 'change' )
                            .live
                            (
                                'change',
                                function()
                                {
                                    var blocks = $( 'tbody', topterms_table_element );
                                    var visible_blocks = blocks.filter( ':visible' );
                                    var hidden_blocks = blocks.filter( ':hidden' );

                                    $( 'p.head .shown', topterms_holder_element )
                                        .html( $( 'tr', visible_blocks ).size() );

                                    0 < hidden_blocks.size()
                                        ? topterms_navi_more.show()
                                        : topterms_navi_more.hide();

                                    1 < visible_blocks.size()
                                        ? topterms_navi_less.show()
                                        : topterms_navi_less.hide();
                                }
                            );

                        $( 'tbody tr:odd', topterms_table_element )
                            .addClass( 'odd' );

                        $( 'tbody:first', topterms_table_element )
                            .show()
                            .trigger( 'change' );

                        $( 'p.head .max', topterms_holder_element )
                            .html( schema_browser_data.fields[field].distinct );

                        topterms_navi_less
                            .die( 'click' )
                            .live
                            (
                                'click',
                                function( event )
                                {
                                    $( 'tbody:visible', topterms_table_element ).last()
                                        .hide()
                                        .trigger( 'change' );
                                }
                            );

                        topterms_navi_more
                            .die( 'click' )
                            .live
                            (
                                'click',
                                function( event )
                                {
                                    $( 'tbody:hidden', topterms_table_element ).first()
                                        .show()
                                        .trigger( 'change' );
                                }
                            );
                    }

                    var histogram_holder_element = $( '.histogram-holder', data_element );
                    if( !schema_browser_data.fields[field].histogram_hash )
                    {
                        histogram_holder_element
                            .hide();
                    }
                    else
                    {
                        histogram_holder_element
                            .show();
                        
                        var histogram_element = $( '.histogram', histogram_holder_element );

                        var histogram_values = schema_browser_data.fields[field].histogram_hash;
                        var histogram_legend = '';

                        histogram_holder_element
                            .show();

                        for( var key in histogram_values )
                        {
                            histogram_legend += '<dt><span>' + key + '</span></dt>' + "\n" +
                                                '<dd title="' + key + '">' +
                                                '<span>' + histogram_values[key] + '</span>' +
                                                '</dd>' + "\n";
                        }

                        $( 'dl', histogram_holder_element )
                            .html( histogram_legend );

                        histogram_element
                            .sparkline
                            (
                                schema_browser_data.fields[field].histogram.values,
                                {
                                    type : 'bar',
                                    barColor : '#c0c0c0',
                                    zeroColor : '#ffffff',
                                    height : histogram_element.height(),
                                    barWidth : 46,
                                    barSpacing : 3
                                }
                            );
                    }
                }

                sammy.trigger
                (
                    'schema_browser_load',
                    {
                        callback : callback,
                        active_core : this.active_core,
                        route_params : this.params
                    }
                );
            }
        );

        // #/:core/schema-browser/dynamic-field/$field
        this.get
        (
            /^#\/([\w\d]+)\/(schema-browser)(\/(dynamic-field)\/(.+))$/,
            function( context )
            {
                var callback = function( schema_browser_data, data_element )
                {
                    console.debug( data_element );
                }

                sammy.trigger
                (
                    'schema_browser_load',
                    {
                        callback : callback,
                        active_core : this.active_core,
                        route_params : this.params
                    }
                );
            }
        );

        // #/:core/schema-browser/type/$type
        this.get
        (
            /^#\/([\w\d]+)\/(schema-browser)(\/(type)\/(.+))$/,
            function( context )
            {
                var callback = function( schema_browser_data, data_element )
                {
                    console.debug( data_element );
                }

                sammy.trigger
                (
                    'schema_browser_load',
                    {
                        callback : callback,
                        active_core : this.active_core,
                        route_params : this.params
                    }
                );
            }
        );

        this.bind
        (
            'dataimport_queryhandler_load',
            function( event, params )
            {
                var core_basepath = params.active_core.attr( 'data-basepath' );

                $.ajax
                (
                    {
                        url : core_basepath + '/admin/mbeans?cat=QUERYHANDLER&wt=json',
                        dataType : 'json',
                        beforeSend : function( xhr, settings )
                        {
                        },
                        success : function( response, text_status, xhr )
                        {
                            var handlers = response['solr-mbeans'][1];
                            var dataimport_handlers = [];
                            for( var key in handlers )
                            {
                                if( handlers[key].class !== key &&
                                    handlers[key].class === 'org.apache.solr.handler.dataimport.DataImportHandler' )
                                {
                                    dataimport_handlers.push( key );
                                }
                            }
                            params.callback( dataimport_handlers );
                        },
                        error : function( xhr, text_status, error_thrown)
                        {
                        },
                        complete : function( xhr, text_status )
                        {
                        }
                    }
                );
            }
        );

        // #/:core/dataimport
        this.get
        (
            /^#\/([\w\d]+)\/dataimport$/,
            function( context )
            {
                sammy.trigger
                (
                    'dataimport_queryhandler_load',
                    {
                        active_core : this.active_core,
                        callback :  function( dataimport_handlers )
                        {
                            context.redirect( context.path + '/' + dataimport_handlers[0] );
                        }
                    }
                );
            }
        );

        // #/:core/dataimport
        this.get
        (
            /^#\/([\w\d]+)\/dataimport\//,
            function( context )
            {
                var core_basepath = this.active_core.attr( 'data-basepath' );
                var content_element = $( '#content' );

                var path_parts = this.path.match( /^(.+\/dataimport\/)(.*)$/ );
                var current_handler = path_parts[2];
                
                $( 'li.dataimport', this.active_core )
                    .addClass( 'active' );

                $.get
                (
                    'tpl/dataimport.html',
                    function( template )
                    {
                        content_element
                            .html( template );

                        var form_element = $( '#form', content_element );

                        // handler

                        sammy.trigger
                        (
                            'dataimport_queryhandler_load',
                            {
                                active_core : context.active_core,
                                callback :  function( dataimport_handlers )
                                {
                                    var handlers_element = $( '.handler', form_element );
                                    var handlers = [];

                                    for( var i = 0; i < dataimport_handlers.length; i++ )
                                    {
                                        handlers.push
                                        (
                                                '<li><a href="' + path_parts[1] + dataimport_handlers[i] + '">' +
                                                dataimport_handlers[i] +
                                                '</a></li>'
                                        );
                                    }

                                    $( 'ul', handlers_element )
                                        .html( handlers.join( "\n") ) ;
                                    
                                    $( 'a[href=' + context.path + ']', handlers_element ).parent()
                                        .addClass( 'active' );
                                    
                                    handlers_element
                                        .show();
                                }
                            }
                        );

                        // config

                        $.ajax
                        (
                            {
                                url : core_basepath + '/select?qt=' + current_handler  + '&command=show-config',
                                dataType : 'xml',
                                context : $( '#dataimport_config', content_element ),
                                beforeSend : function( xhr, settings )
                                {
                                },
                                success : function( config, text_status, xhr )
                                {
                                    var entities = [];

                                    $( 'document > entity', config )
                                        .each
                                        (
                                            function( i, element )
                                            {
                                                entities.push( '<option>' + $( element ).attr( 'name' ) + '</option>' );
                                            }
                                        );
                                    
                                    $( '#entity', form_element )
                                        .append( entities.join( "\n" ) );
                                },
                                error : function( xhr, text_status, error_thrown )
                                {
                                    if( 'parsererror' === error_thrown )
                                    {
                                        console.error( 'xml not valid!' );
                                        console.debug( arguments );
                                    }
                                    else
                                    {
                                        console.debug( arguments );
                                    }
                                },
                                complete : function( xhr, text_status )
                                {
                                    var code = $(
                                        '<pre class="syntax language-xml"><code>' +
                                        xhr.responseText.replace( /\</g, '&lt;' ).replace( /\>/g, '&gt;' ) +
                                        '</code></pre>'
                                    );
                                    this.html( code );
                                    
                                    if( 'success' === text_status )
                                    {
                                        hljs.highlightBlock( code.get(0) );
                                    }
                                }
                            }
                        );

                        $( '#config .toggle', content_element )
                            .die( 'click' )
                            .live
                            (
                                'click',
                                function( event )
                                {
                                    $( this ).parents( '.block' )
                                        .toggleClass( 'hidden' );
                                    
                                    return false;
                                }
                            )

                        var reload_config_element = $( '#config .reload_config', content_element );
                        reload_config_element
                            .die( 'click' )
                            .live
                            (
                                'click',
                                function( event )
                                {
                                    $.ajax
                                    (
                                        {
                                            url : core_basepath + '/select?qt=' + current_handler  + '&command=reload-config',
                                            dataType : 'xml',
                                            context: $( this ),
                                            beforeSend : function( xhr, settings )
                                            {
                                                this
                                                    .addClass( 'loader' );
                                            },
                                            success : function( response, text_status, xhr )
                                            {
                                                this
                                                    .addClass( 'success' );

                                                window.setTimeout
                                                (
                                                    function()
                                                    {
                                                        reload_config_element
                                                            .removeClass( 'success' );
                                                    },
                                                    5000
                                                );
                                            },
                                            error : function( xhr, text_status, error_thrown )
                                            {
                                                this
                                                    .addClass( 'error' );
                                            },
                                            complete : function( xhr, text_status )
                                            {
                                                this
                                                    .removeClass( 'loader' );
                                            }
                                        }
                                    );
                                    return false;
                                }
                            )

                        // state
                        
                        function dataimport_fetch_status()
                        {
                            $.ajax
                            (
                                {
                                    url : core_basepath + '/select?qt=' + current_handler  + '&command=status',
                                    dataType : 'xml',
                                    beforeSend : function( xhr, settings )
                                    {
                                    },
                                    success : function( response, text_status, xhr )
                                    {
                                        var state_element = $( '#current_state', content_element );

                                        var status = $( 'str[name="status"]', response ).text();
                                        var rollback_element = $( 'str[name="Rolledback"]', response );
                                        var messages_count = $( 'lst[name="statusMessages"] str', response ).size();

                                        var started_at = $( 'str[name="Full Dump Started"]', response ).text();
                                        if( !started_at )
                                        {
                                            started_at = (new Date()).toGMTString();
                                        }
                                        console.debug( 'started_at @ ', started_at );

                                        function dataimport_compute_details( response, details_element )
                                        {
                                            var details = [];

                                            
                                            console.debug( 'elapsed @ ', $( 'str[name="Time Elapsed"]', response ).text() );
                                            console.debug( 'taken @ ', $( 'str[name="Time taken "]', response ).text() );
                                            console.debug( 'requests @ ', $( 'str[name="Total Requests made to DataSource"]', response ).text() );
                                            console.debug( 'fetched @ ', $( 'str[name="Total Rows Fetched"]', response ).text() );
                                            console.debug( 'skipped @ ', $( 'str[name="Total Documents Skipped"]', response ).text() );
                                            console.debug( 'processed @ ', $( 'str[name="Total Documents Processed"]', response ).text() );

                                            var requests = parseInt( $( 'str[name="Total Requests made to DataSource"]', response ).text() );
                                            if( NaN !== requests )
                                            {
                                                details.push
                                                (
                                                    '<abbr title="Total Requests made to DataSource">Requests</abbr>: ' +
                                                    requests
                                                );
                                            }

                                            var fetched = parseInt( $( 'str[name="Total Rows Fetched"]', response ).text() );
                                            if( NaN !== fetched )
                                            {
                                                details.push
                                                (
                                                    '<abbr title="Total Rows Fetched">Fetched</abbr>: ' +
                                                    fetched
                                                );
                                            }

                                            var skipped = parseInt( $( 'str[name="Total Documents Skipped"]', response ).text() );
                                            if( NaN !== requests )
                                            {
                                                details.push
                                                (
                                                    '<abbr title="Total Documents Skipped">Skipped</abbr>: ' +
                                                    skipped
                                                );
                                            }

                                            var processed = parseInt( $( 'str[name="Total Documents Processed"]', response ).text() );
                                            if( NaN !== processed )
                                            {
                                                details.push
                                                (
                                                    '<abbr title="Total Documents Processed">Processed</abbr>: ' +
                                                    processed
                                                );
                                            }

                                            details_element
                                                .html( details.join( ', ' ) );
                                        }

                                        state_element
                                            .removeClass( 'indexing' )
                                            .removeClass( 'success' )
                                            .removeClass( 'failure' );
                                        
                                        $( '.info', state_element )
                                            .removeClass( 'loader' );

                                        if( 0 !== rollback_element.size() )
                                        {
                                            state_element
                                                .addClass( 'failure' )
                                                .show();

                                            $( '.info strong', state_element )
                                                .text( $( 'str[name=""]', response ).text() );
                                            
                                            console.debug( 'failure' );
                                            console.debug( 'rollback @ ', rollback_element.text() );
                                        }
                                        else if( 'idle' === status && 0 !== messages_count )
                                        {
                                            state_element
                                                .addClass( 'success' )
                                                .show();

                                            $( '.time', state_element )
                                                .text( started_at )
                                                .timeago();

                                            $( '.info strong', state_element )
                                                .text( $( 'str[name=""]', response ).text() );

                                            console.debug( 'success' );
                                            dataimport_compute_details( response, $( '.info .details', state_element ) );
                                        }
                                        else if( 'busy' === status )
                                        {
                                            state_element
                                                .addClass( 'indexing' )
                                                .show();

                                            $( '.time', state_element )
                                                .text( started_at )
                                                .timeago();

                                            $( '.info', state_element )
                                                .addClass( 'loader' );

                                            $( '.info strong', state_element )
                                                .text( 'Indexing ...' );
                                            
                                            console.debug( 'indexing' );
                                            dataimport_compute_details( response, $( '.info .details', state_element ) );

                                            window.setTimeout( dataimport_fetch_status, 2000 );
                                        }
                                        else
                                        {
                                            state_element.hide();
                                        }
                                    },
                                    error : function( xhr, text_status, error_thrown )
                                    {
                                        console.debug( arguments );
                                    },
                                    complete : function( xhr, text_status )
                                    {
                                    }
                                }
                            );
                        }
                        dataimport_fetch_status();

                        // form

                        $( 'form', form_element )
                            .die( 'submit' )
                            .live
                            (
                                'submit',
                                function( event )
                                {
                                    $.ajax
                                    (
                                        {
                                            url : core_basepath + '/select?qt=' + current_handler  + '&command=full-import',
                                            dataType : 'xml',
                                            beforeSend : function( xhr, settings )
                                            {
                                            },
                                            success : function( response, text_status, xhr )
                                            {
                                                console.debug( response );
                                                dataimport_fetch_status();
                                            },
                                            error : function( xhr, text_status, error_thrown )
                                            {
                                                console.debug( arguments );
                                            },
                                            complete : function( xhr, text_status )
                                            {
                                            }
                                        }
                                    );
                                    return false;
                                }
                            );
                    }
                );
            }
        );

        // #/:core/info(/stats)
        this.get
        (
            /^#\/([\w\d]+)\/info/,
            function( context )
            {
                var core_basepath = this.active_core.attr( 'data-basepath' );
                var content_element = $( '#content' );
                var show_stats = 0 <= this.path.indexOf( 'stats' );
                
                if( show_stats )
                {
                    $( 'li.stats', this.active_core )
                        .addClass( 'active' );
                }
                else
                {
                    $( 'li.plugins', this.active_core )
                        .addClass( 'active' );
                }
                
                content_element
                    .html( '<div id="plugins"></div>' );
                
                $.ajax
                (
                    {
                        url : core_basepath + '/admin/mbeans?stats=true&wt=json',
                        dataType : 'json',
                        context : $( '#plugins', content_element ),
                        beforeSend : function( xhr, settings )
                        {
                            this
                                .html( '<div class="loader">Loading ...</div>' );
                        },
                        success : function( response, text_status, xhr )
                        {
                            var sort_table = {};
                            var content = '';
                            
                            response.plugins = {};
                            var plugin_key = null;

                            for( var i = 0; i < response['solr-mbeans'].length; i++ )
                            {
                                if( !( i % 2 ) )
                                {
                                    plugin_key = response['solr-mbeans'][i];
                                }
                                else
                                {
                                    response.plugins[plugin_key] = response['solr-mbeans'][i];
                                }
                            }

                            for( var key in response.plugins )
                            {
                                sort_table[key] = {
                                    url : [],
                                    component : [],
                                    handler : []
                                };
                                for( var part_key in response.plugins[key] )
                                {
                                    if( 0 < part_key.indexOf( '.' ) )
                                    {
                                        sort_table[key]['handler'].push( part_key );
                                    }
                                    else if( 0 === part_key.indexOf( '/' ) )
                                    {
                                        sort_table[key]['url'].push( part_key );
                                    }
                                    else
                                    {
                                        sort_table[key]['component'].push( part_key );
                                    }
                                }
                                
                                content += '<div class="block" id="' + key.toLowerCase() + '">' + "\n";
                                content += '<h2><span>' + key + '</span></h2>' + "\n";
                                content += '<div class="content">' + "\n";
                                content += '<ul>' + "\n";
                                
                                for( var sort_key in sort_table[key] )
                                {
                                    sort_table[key][sort_key].sort();
                                    var sort_key_length = sort_table[key][sort_key].length;
                                    
                                    for( var i = 0; i < sort_key_length; i++ )
                                    {
                                        content += '<li class="entry"><a>' + sort_table[key][sort_key][i] + '</a>' + "\n";
                                        content += '<ul class="detail">' + "\n";
                                        
                                        var details = response.plugins[key][ sort_table[key][sort_key][i] ];
                                        for( var detail_key in details )
                                        {
                                            if( 'stats' !== detail_key )
                                            {
                                                var detail_value = details[detail_key];

                                                if( 'description' === detail_key )
                                                {
                                                    detail_value = detail_value.replace( /,/g, ',&#8203;' );
                                                }
                                                else if( 'src' === detail_key )
                                                {
                                                    detail_value = detail_value.replace( /\//g, '/&#8203;' );
                                                }

                                                content += '<li><dl class="clearfix">' + "\n";
                                                content += '<dt>' + detail_key + ':</dt>' + "\n";
                                                content += '<dd>' + detail_value + '</dd>' + "\n";
                                                content += '</dl></li>' + "\n";
                                            }
                                            else if( 'stats' === detail_key && details[detail_key] && show_stats )
                                            {
                                                content += '<li class="stats clearfix">' + "\n";
                                                content += '<span>' + detail_key + ':</span>' + "\n";
                                                content += '<ul>' + "\n";

                                                for( var stats_key in details[detail_key] )
                                                {
                                                    var stats_value = details[detail_key][stats_key];

                                                    if( 'readerDir' === stats_key )
                                                    {
                                                        stats_value = stats_value.replace( /@/g, '@&#8203;' );
                                                    }

                                                    content += '<li><dl class="clearfix">' + "\n";
                                                    content += '<dt>' + stats_key + ':</dt>' + "\n";
                                                    content += '<dd>' + stats_value + '</dd>' + "\n";
                                                    content += '</dl></li>' + "\n";
                                                }

                                                content += '</ul></li>' + "\n";
                                            }
                                        }
                                        
                                        content += '</ul>' + "\n";
                                    }
                                }
                                
                                content += '</ul>' + "\n";
                                content += '</div>' + "\n";
                                content += '</div>' + "\n";
                            }
                            
                            this
                                .html( content );
                            
                            $( '.block a', this )
                                .die( 'click' )
                                .live
                                (
                                    'click',
                                    function( event )
                                    {
                                        $( this ).parent()
                                            .toggleClass( 'expanded' );
                                    }
                                );
                            
                            $( '.entry', this )
                                .each
                                (
                                    function( i, entry )
                                    {
                                        $( '.detail > li', entry ).not( '.stats' ).filter( ':even' )
                                            .addClass( 'odd' );

                                        $( '.stats li:odd', entry )
                                            .addClass( 'odd' );
                                    }
                                );
                        },
                        error : function( xhr, text_status, error_thrown)
                        {
                        },
                        complete : function( xhr, text_status )
                        {
                        }
                    }
                );
                
            }
        );

        // #/:core/query
        this.get
        (
            /^#\/([\w\d]+)\/query$/,
            function( context )
            {
                var core_basepath = this.active_core.attr( 'data-basepath' );
                var content_element = $( '#content' );
                
                $( 'li.query', this.active_core )
                    .addClass( 'active' );
                
                $.get
                (
                    'tpl/query.html',
                    function( template )
                    {
                        content_element
                            .html( template );

                        var query_element = $( '#query', content_element );
                        var query_form = $( '#form form', query_element );
                        var url_element = $( '#url input', query_element );
                        var result_element = $( '#result', query_element );
                        var response_element = $( '#response iframe', result_element );

                        url_element
                            .die( 'change' )
                            .live
                            (
                                'change',
                                function( event )
                                {
                                    var check_iframe_ready_state = function()
                                    {
                                        var iframe_element = response_element.get(0).contentWindow.document || 
                                                             response_element.get(0).document;

                                        if( !iframe_element )
                                        {
                                            console.debug( 'no iframe_element found', response_element );
                                            return false;
                                        }

                                        url_element
                                            .addClass( 'loader' );

                                        if( 'complete' === iframe_element.readyState )
                                        {
                                            url_element
                                                .removeClass( 'loader' );
                                        }
                                        else
                                        {
                                            window.setTimeout( check_iframe_ready_state, 100 );
                                        }
                                    }
                                    check_iframe_ready_state();

                                    response_element
                                        .attr( 'src', this.value )
                                    
                                    if( !response_element.hasClass( 'resized' ) )
                                    {
                                        response_element
                                            .addClass( 'resized' )
                                            .css( 'height', $( '#main' ).height() - 60 );
                                    }
                                }
                            )

                        $( '.optional legend input[type=checkbox]', query_form )
                            .die( 'change' )
                            .live
                            (
                                'change',
                                function( event )
                                {
                                    var fieldset = $( this ).parents( 'fieldset' );

                                    this.checked
                                        ? fieldset.addClass( 'expanded' )
                                        : fieldset.removeClass( 'expanded' );
                                }
                            )

                        query_form
                            .die( 'submit' )
                            .live
                            (
                                'submit',
                                function( event )
                                {
                                    var query_url = window.location.protocol + '//' +
                                                    window.location.host +
                                                    core_basepath +
                                                    '/select?' +
                                                    query_form.formSerialize();
                                    
                                    url_element
                                        .val( query_url )
                                        .trigger( 'change' );
                                    
                                    result_element
                                        .show();
                                    
                                    return false;
                                }
                            );
                    }
                );
            }
        );
        
        // #/:core/analysis
        this.get
        (
            /^#\/([\w\d]+)\/analysis$/,
            function( context )
            {
                var core_basepath = this.active_core.attr( 'data-basepath' );
                var content_element = $( '#content' );
                
                $( 'li.analysis', this.active_core )
                    .addClass( 'active' );
                
                $.get
                (
                    'tpl/analysis.html',
                    function( template )
                    {
                        content_element
                            .html( template );
                        
                        var analysis_element = $( '#analysis', content_element );
                        var analysis_form = $( 'form', analysis_element );
                        
                        $.ajax
                        (
                            {
                                url : core_basepath + '/admin/luke?wt=json&show=schema',
                                dataType : 'json',
                                context : $( '#type_or_name', analysis_form ),
                                beforeSend : function( xhr, settings )
                                {
                                    this
                                        .html( '<option value="">Loading ... </option>' )
                                        .addClass( 'loader' );
                                },
                                success : function( response, text_status, xhr )
                                {
                                    var content = '';
                                    
                                    var fields = [];
                                    for( var field_name in response.schema.fields )
                                    {
                                        fields.push
                                        (
                                            '<option value="fieldname=' + field_name + '">' + field_name + '</option>'
                                        );
                                    }
                                    if( 0 !== fields.length )
                                    {
                                        content += '<optgroup label="Fields">' + "\n";
                                        content += fields.join( "\n" ) + "\n";
                                        content += '</optgroup>' + "\n";
                                    }
                                    
                                    var types = [];
                                    for( var type_name in response.schema.types )
                                    {
                                        types.push
                                        (
                                            '<option value="fieldtype=' + type_name + '">' + type_name + '</option>'
                                        );
                                    }
                                    if( 0 !== types.length )
                                    {
                                        content += '<optgroup label="Types">' + "\n";
                                        content += types.join( "\n" ) + "\n";
                                        content += '</optgroup>' + "\n";
                                    }
                                    
                                    this
                                        .html( content );
                                    
                                    $( 'option[value=fieldname\=' + response.schema.defaultSearchField + ']', this )
                                        .attr( 'selected', 'selected' );
                                },
                                error : function( xhr, text_status, error_thrown)
                                {
                                },
                                complete : function( xhr, text_status )
                                {
                                    this
                                        .removeClass( 'loader' );
                                }
                            }
                        );
                        
                        var analysis_result = $( '.analysis-result', analysis_element );
                        analysis_result_tpl = analysis_result.clone();
                        analysis_result.remove();
                        
                        analysis_form
                            .ajaxForm
                            (
                                {
                                    url : core_basepath + '/analysis/field?wt=json',
                                    dataType : 'json',
                                    beforeSubmit : function( array, form, options )
                                    {
                                        //loader
                                        
                                        $( '.analysis-result', analysis_element )
                                            .remove();
                                        
                                        array.push( { name: 'analysis.showmatch', value: 'true' } );
                                        
                                        var type_or_name = $( '#type_or_name', form ).val().split( '=' );
                                        
                                        array.push( { name: 'analysis.' + type_or_name[0], value: type_or_name[1] } );
                                    },
                                    success : function( response, status_text, xhr, form )
                                    {
                                        for( var name in response.analysis.field_names )
                                        {
                                            build_analysis_table( 'name', name, response.analysis.field_names[name] );
                                        }
                                        
                                        for( var name in response.analysis.field_types )
                                        {
                                            build_analysis_table( 'type', name, response.analysis.field_types[name] );
                                        }
                                    },
                                    complete : function()
                                    {
                                        //loader
                                    }
                                }
                            );
                            
                            var build_analysis_table = function( field_or_name, name, analysis_data )
                            {                                
                                var analysis_result_data = analysis_result_tpl.clone();
                                var content = [];
                                
                                for( var type in analysis_data )
                                {
                                    var type_length = analysis_data[type].length;
                                    if( 0 !== type_length )
                                    {
                                        var type_content = '<div class="' + type + '">' + "\n";
                                        for( var i = 0; i < type_length; i += 2 )
                                        {
                                            type_content += '<div class="row">' + "\n";
                                        
                                            var analyzer_parts = analysis_data[type][i].split( '.' );
                                            var analyzer_parts_name = analyzer_parts.pop();
                                            var analyzer_parts_namespace = analyzer_parts.join( '.' ) + '.';
                                                                                        
                                            type_content += '<div class="analyzer" title="' + analysis_data[type][i] +'">' + 
                                                            analyzer_parts_name + '</div>' + "\n";

                                            var raw_parts = {
                                                'position' : [],
                                                'text' : [],
                                                'type' : [],
                                                'start-end' : []
                                            };
                                            
                                            for( var k in analysis_data[type][i+1] )
                                            {
                                                var pos = analysis_data[type][i+1][k]['position'] - 1;
                                                var is_match = !!analysis_data[type][i+1][k]['match'];
                                            
                                                if( 'undefined' === typeof raw_parts['text'][pos] )
                                                {
                                                    raw_parts['position'][pos] = [];
                                                    raw_parts['text'][pos] = [];
                                                    raw_parts['type'][pos] = [];
                                                    raw_parts['start-end'][pos] = [];

                                                    raw_parts['position'][pos].push( '<div>' + analysis_data[type][i+1][k]['position'] + '</div>' );
                                                }

                                                raw_parts['text'][pos].push( '<div class="' + ( is_match ? 'match' : '' ) + '">' + analysis_data[type][i+1][k]['text'] + '</div>' );
                                                raw_parts['type'][pos].push( '<div>' + analysis_data[type][i+1][k]['type'] + '</div>' );
                                                raw_parts['start-end'][pos].push( '<div>' + analysis_data[type][i+1][k]['start'] + '–' + analysis_data[type][i+1][k]['end'] + '</div>' );
                                            }

                                            var parts = {
                                                'position' : [],
                                                'text' : [],
                                                'type' : [],
                                                'start-end' : []
                                            };

                                            for( var key in raw_parts )
                                            {
                                                var length = raw_parts[key].length;
                                                for( var j = 0; j < length; j++ )
                                                {
                                                    parts[key].push( '<td>' + raw_parts[key][j].join( "\n" ) + '</td>' );
                                                }
                                            }

                                            type_content += '<div class="result">' + "\n";
                                            type_content += '<table border="0" cellspacing="0" cellpadding="0">' + "\n";
                                            
                                            type_content += '<tr class="verbose_output">' + "\n";
                                            type_content += '<th><abbr title="Position">P</abbr></th>' + "\n";
                                            type_content += parts['position'].join( "\n" ) + "\n";
                                            type_content += '</tr>' + "\n";
                                                                                        
                                            type_content += '<tr>' + "\n";
                                            type_content += '<th><abbr title="Text">T</abbr></th>' + "\n";
                                            type_content += parts['text'].join( "\n" ) + "\n";
                                            type_content += '</tr>' + "\n";

                                            type_content += '<tr class="verbose_output">' + "\n";
                                            type_content += '<th><abbr title="Type">T</abbr></th>' + "\n";
                                            type_content += parts['type'].join( "\n" ) + "\n";
                                            type_content += '</tr>' + "\n";

                                            type_content += '<tr class="verbose_output">' + "\n";
                                            type_content += '<th><abbr title="Range (Start, End)">R</abbr></th>' + "\n";
                                            type_content += parts['start-end'].join( "\n" ) + "\n";
                                            type_content += '</tr>' + "\n";
                                            
                                            type_content += '</table>' + "\n";
                                            type_content += '</div>' + "\n";
                                            
                                            type_content += '</div>' + "\n";
                                        }
                                        type_content += '</div>';
                                        content.push( $.trim( type_content ) );
                                    }
                                }
                                
                                $( 'h2 span', analysis_result_data )
                                    .html( field_or_name + ': ' + name );
                                
                                $( 'h2 .verbose_output a', analysis_result_data )
                                    .die( 'click' )
                                    .live
                                    (
                                        'click',
                                        function( event )
                                        {
                                            $( this ).parents( '.block' )
                                                .toggleClass( 'verbose_output' );
                                        }
                                    );
                                
                                $( '.analysis-result-content', analysis_result_data )
                                    .html( content.join( "\n" ) );
                                
                                analysis_element.append( analysis_result_data );
                                
                            }
                            
                    }
                );
            }
        );
        
        // #/:core/schema, #/:core/config
        this.get
        (
            /^#\/([\w\d]+)\/(schema|config)$/,
            function( context )
            {
                var content_element = $( '#content' );

                content_element
                    .html( '<iframe src="' + $( '.active a', this.active_core ).attr( 'href' ) + '"></iframe>' );
                
                $( 'iframe', content_element )
                    .css( 'height', $( '#main' ).height() );
            }
        );
        
        // #/:core
        this.get
        (
            /^#\/([\w\d]+)$/,
            function( context )
            {
                var core_basepath = this.active_core.attr( 'data-basepath' );
                var content_element = $( '#content' );
                
                content_element
                    .removeClass( 'single' );
                
                var core_menu = $( 'ul', this.active_core );
                if( !core_menu.data( 'admin-extra-loaded' ) )
                {
                    core_menu.data( 'admin-extra-loaded', new Date() );

                    $.get
                    (
                        core_basepath + '/admin/file/?file=admin-extra.menu-top.html',
                        function( menu_extra )
                        {
                            core_menu
                                .prepend( menu_extra );
                        }
                    );
                    
                    $.get
                    (
                        core_basepath + '/admin/file/?file=admin-extra.menu-bottom.html',
                        function( menu_extra )
                        {
                            core_menu
                                .append( menu_extra );
                        }
                    );
                }
                
                $.get
                (
                    'tpl/dashboard.html',
                    function( template )
                    {
                        content_element
                            .html( template );
                            
                        var dashboard_element = $( '#dashboard' );
                        
                        /*
                        $.ajax
                        (
                            {
                                url : core_basepath + '/admin/system?wt=json',
                                dataType : 'json',
                                context : $( '#system', dashboard_element ),
                                beforeSend : function( xhr, settings )
                                {
                                    $( 'h2', this )
                                        .addClass( 'loader' );
                                    
                                    $( '.message', this )
                                        .show()
                                        .html( 'Loading' );
                                },
                                success : function( response, text_status, xhr )
                                {
                                    $( '.message', this )
                                        .empty()
                                        .hide();
                                    
                                    $( 'dl', this )
                                        .show();
                                        
                                    var data = {
                                        'core_now' : response['core']['now'],
                                        'core_start' : response['core']['start'],
                                        'core_host' : response['core']['host'],
                                        'core_schema' : response['core']['schema'],
                                        'lucene_solr-spec-version' : response['lucene']['solr-spec-version'],
                                        'lucene_solr-impl-version' : response['lucene']['solr-impl-version'],
                                        'lucene_lucene-spec-version' : response['lucene']['lucene-spec-version'],
                                        'lucene_lucene-impl-version' : response['lucene']['lucene-impl-version']
                                    };
                                    
                                    for( var key in data )
                                    {
                                        $( '.' + key, this )
                                            .show();
                                        
                                        $( '.value.' + key, this )
                                            .html( data[key] );
                                    }
                                },
                                error : function( xhr, text_status, error_thrown)
                                {
                                    this
                                        .addClass( 'disabled' );
                                    
                                    $( '.message', this )
                                        .show()
                                        .html( 'System-Handler is not configured' );
                                },
                                complete : function( xhr, text_status )
                                {
                                    $( 'h2', this )
                                        .removeClass( 'loader' );
                                }
                            }
                        );
                        //*/
                        
                        $.ajax
                        (
                            {
                                url : core_basepath + '/admin/luke?wt=json',
                                dataType : 'json',
                                context : $( '#statistics', dashboard_element ),
                                beforeSend : function( xhr, settings )
                                {
                                    $( 'h2', this )
                                        .addClass( 'loader' );
                                    
                                    $( '.message', this )
                                        .show()
                                        .html( 'Loading ...' );
                                    
                                    $( '.content' )
                                        .hide();
                                },
                                success : function( response, text_status, xhr )
                                {
                                    $( '.message', this )
                                        .empty()
                                        .hide();
                                    
                                    $( '.content', this )
                                        .show();
                                        
                                    var data = {
                                        'index_num-docs' : response['index']['numDocs'],
                                        'index_max-doc' : response['index']['maxDoc'],
                                        'index_last-modified' : response['index']['lastModified']
                                    };
                                    
                                    for( var key in data )
                                    {
                                        $( '.' + key, this )
                                            .show();
                                        
                                        $( '.value.' + key, this )
                                            .html( data[key] );
                                    }

                                    var optimized_element = $( '.value.index_optimized', this );
                                    if( response['index']['optimized'] )
                                    {
                                        optimized_element
                                            .addClass( 'ico-1' );

                                        $( 'span', optimized_element )
                                            .html( 'yes' );
                                    }
                                    else
                                    {
                                        optimized_element
                                            .addClass( 'ico-0' );

                                        $( 'span', optimized_element )
                                            .html( 'no' );
                                    }

                                    var current_element = $( '.value.index_current', this );
                                    if( response['index']['current'] )
                                    {
                                        current_element
                                            .addClass( 'ico-1' );

                                        $( 'span', current_element )
                                            .html( 'yes' );
                                    }
                                    else
                                    {
                                        current_element
                                            .addClass( 'ico-0' );

                                        $( 'span', current_element )
                                            .html( 'no' );
                                    }

                                    var deletions_element = $( '.value.index_has-deletions', this );
                                    if( response['index']['hasDeletions'] )
                                    {
                                        deletions_element.prev()
                                            .show();
                                        
                                        deletions_element
                                            .show()
                                            .addClass( 'ico-0' );

                                        $( 'span', deletions_element )
                                            .html( 'yes' );
                                    }

                                    $( 'a', optimized_element )
                                        .die( 'click' )
                                        .live
                                        (
                                            'click',
                                            function( event )
                                            {                        
                                                $.ajax
                                                (
                                                    {
                                                        url : core_basepath + '/update?optimize=true&waitFlush=true&wt=json',
                                                        dataType : 'json',
                                                        context : $( this ),
                                                        beforeSend : function( xhr, settings )
                                                        {
                                                            this
                                                                .addClass( 'loader' );
                                                        },
                                                        success : function( response, text_status, xhr )
                                                        {
                                                            this.parents( 'dd' )
                                                                .removeClass( 'ico-0' )
                                                                .addClass( 'ico-1' );
                                                        },
                                                        error : function( xhr, text_status, error_thrown)
                                                        {
                                                            console.warn( 'd0h, optimize broken!' );
                                                        },
                                                        complete : function( xhr, text_status )
                                                        {
                                                            this
                                                                .removeClass( 'loader' );
                                                        }
                                                    }
                                                );
                                            }
                                        );

                                    $( '.timeago', this )
                                         .timeago();
                                },
                                error : function( xhr, text_status, error_thrown)
                                {
                                    this
                                        .addClass( 'disabled' );
                                    
                                    $( '.message', this )
                                        .show()
                                        .html( 'Luke is not configured' );
                                },
                                complete : function( xhr, text_status )
                                {
                                    $( 'h2', this )
                                        .removeClass( 'loader' );
                                }
                            }
                        );
                        
                        $.ajax
                        (
                            {
                                url : core_basepath + '/replication?command=details&wt=json',
                                dataType : 'json',
                                context : $( '#replication', dashboard_element ),
                                beforeSend : function( xhr, settings )
                                {
                                    $( 'h2', this )
                                        .addClass( 'loader' );
                                    
                                    $( '.message', this )
                                        .show()
                                        .html( 'Loading' );

                                    $( '.content', this )
                                        .hide();
                                },
                                success : function( response, text_status, xhr )
                                {
                                    $( '.message', this )
                                        .empty()
                                        .hide();

                                    $( '.content', this )
                                        .show();
                                    
                                    $( '.replication', context.active_core )
                                        .show();
                                    
                                    var is_master = 'undefined' === typeof( response['details']['slave'] );
                                    var headline = $( 'h2 span', this );

                                    if( is_master )
                                    {
                                        this
                                            .addClass( 'is-master' );
                                        
                                        headline
                                            .html( headline.html() + ' (Master)' );
                                    }
                                    else
                                    {
                                        this
                                            .addClass( 'is-slave' );
                                        
                                        headline
                                            .html( headline.html() + ' (Slave)' );
                                    }
                                    
                                    var data = {
                                        'details_index-version' : response['details']['indexVersion'],
                                        'details_generation' : response['details']['generation'],
                                        'details_index-size' : response['details']['indexSize']
                                    };
                                    
                                    if( !is_master )
                                    {
                                        $.extend
                                        (
                                            data,
                                            {
                                                'details_slave_master-details_index-version' : response['details']['slave']['masterDetails']['indexVersion'],
                                                'details_slave_master-details_generation' : response['details']['slave']['masterDetails']['generation'],
                                                'details_slave_master-details_index-size' : response['details']['slave']['masterDetails']['indexSize'],
                                                'details_slave_master-url' : response['details']['slave']['masterUrl'],
                                                'details_slave_poll-interval' : response['details']['slave']['pollInterval'],
                                                'details_slave_next-execution-at' : response['details']['slave']['nextExecutionAt'],
                                                'details_slave_index-replicated-at' : response['details']['slave']['indexReplicatedAt'],
                                                'details_slave_last-cycle-bytes-downloaded' : response['details']['slave']['lastCycleBytesDownloaded'],
                                                'details_slave_replication-failed-at' : response['details']['slave']['replicationFailedAt'],
                                                'details_slave_previous-cycle-time-in-seconds' : response['details']['slave']['previousCycleTimeInSeconds'],
                                                'details_slave_is-polling-disabled' : response['details']['slave']['isPollingDisabled'],
                                                'details_slave_is-replicating' : response['details']['slave']['isReplicating']
                                            }
                                        );
                                    
                                        $( 'dl', this )
                                            .show();
                                    }
                                    
                                    for( var key in data )
                                    {
                                        $( '.' + key, this )
                                            .show();
                                        
                                        $( '.value.' + key, this )
                                            .html( data[key] );
                                    }

                                    // $( '.timeago', this )
                                    //     .timeago();
                                },
                                error : function( xhr, text_status, error_thrown)
                                {
                                    this
                                        .addClass( 'disabled' );
                                    
                                    $( '.message', this )
                                        .show()
                                        .html( 'Replication is not configured' );
                                },
                                complete : function( xhr, text_status )
                                {
                                    $( 'h2', this )
                                        .removeClass( 'loader' );
                                }
                            }
                        );

                        /*
                        $.ajax
                        (
                            {
                                url : core_basepath + '/dataimport?command=details&wt=json',
                                dataType : 'json',
                                context : $( '#dataimport', dashboard_element ),
                                beforeSend : function( xhr, settings )
                                {
                                    $( 'h2', this )
                                        .addClass( 'loader' );

                                    $( '.message', this )
                                        .show()
                                        .html( 'Loading' );
                                },
                                success : function( response, text_status, xhr )
                                {
                                    $( '.message', this )
                                        .empty()
                                        .hide();
                                    
                                    $( 'dl', this )
                                        .show();
                                    
                                    var data = {
                                        'status' : response['status'],
                                        'info' : response['statusMessages']['']
                                    };
                                    
                                    for( var key in data )
                                    {
                                        $( '.' + key, this )
                                            .show();
                                        
                                        $( '.value.' + key, this )
                                            .html( data[key] );
                                    }
                                },
                                error : function( xhr, text_status, error_thrown)
                                {
                                    this
                                        .addClass( 'disabled' );
                                    
                                    $( '.message', this )
                                        .show()
                                        .html( 'DataImport is not configured' );
                                },
                                complete : function( xhr, text_status )
                                {
                                    $( 'h2', this )
                                        .removeClass( 'loader' );
                                }
                            }
                        );
                        //*/
                        
                        $.ajax
                        (
                            {
                                url : core_basepath + '/admin/file/?file=admin-extra.html',
                                dataType : 'html',
                                context : $( '#admin-extra', dashboard_element ),
                                beforeSend : function( xhr, settings )
                                {
                                    $( 'h2', this )
                                        .addClass( 'loader' );
                                    
                                    $( '.message', this )
                                        .show()
                                        .html( 'Loading' );

                                    $( '.content', this )
                                        .hide();
                                },
                                success : function( response, text_status, xhr )
                                {
                                    $( '.message', this )
                                        .hide()
                                        .empty();

                                    $( '.content', this )
                                        .show()
                                        .html( response );
                                },
                                error : function( xhr, text_status, error_thrown)
                                {
                                    this
                                        .addClass( 'disabled' );
                                    
                                    $( '.message', this )
                                        .show()
                                        .html( 'We found no "admin-extra.html" file.' );
                                },
                                complete : function( xhr, text_status )
                                {
                                    $( 'h2', this )
                                        .removeClass( 'loader' );
                                }
                            }
                        );
                        
                    }
                );
            }
        );
        
        // #/
        this.get
        (
            /^#\/$/,
            function( context )
            {
                var content_element = $( '#content' );

                $( '#index', app.menu_element )
                    .addClass( 'active' );

                content_element
                    .html( '<div id="index"></div>' );

                $.ajax
                (
                    {
                        url : 'tpl/index.html',
                        context : $( '#index', content_element ),
                        beforeSend : function( arr, form, options )
                        {
                        },
                        success : function( template )
                        {
                            this
                                .html( template );
            
                            var memory_data = {};
                            if( app.dashboard_values['jvm']['memory']['raw'] )
                            {
                                var jvm_memory = app.dashboard_values['jvm']['memory']['raw'];
                                memory_data['memory-bar-max'] = parseInt( jvm_memory['max'] );
                                memory_data['memory-bar-total'] = parseInt( jvm_memory['total'] );
                                memory_data['memory-bar-used'] = parseInt( jvm_memory['used'] );
                            }
                            else
                            {
                                var jvm_memory = app.dashboard_values['jvm']['memory'];
                                memory_data['memory-bar-max'] = parseFloat( jvm_memory['max'] ) * 1024 * 1024;
                                memory_data['memory-bar-total'] = parseFloat( jvm_memory['total'] ) * 1024 * 1024;
                                memory_data['memory-bar-used'] = parseFloat( jvm_memory['used'] ) * 1024 * 1024;
                            }
            
                            for( var key in memory_data )
                            {                                                        
                                $( '.value.' + key, this )
                                    .html( memory_data[key] );
                            }
            
                            var data = {
                                'start_time' : app.dashboard_values['jvm']['jmx']['startTime'],
                                'host' : app.dashboard_values['core']['host'],
                                'jvm' : app.dashboard_values['jvm']['name'] + ' (' + app.dashboard_values['jvm']['version'] + ')',
                                'solr_spec_version' : app.dashboard_values['lucene']['solr-spec-version'],
                                'solr_impl_version' : app.dashboard_values['lucene']['solr-impl-version'],
                                'lucene_spec_version' : app.dashboard_values['lucene']['lucene-spec-version'],
                                'lucene_impl_version' : app.dashboard_values['lucene']['lucene-impl-version']
                            };

                            if( app.dashboard_values['core']['directory']['cwd'] )
                            {
                                data['cwd'] = app.dashboard_values['core']['directory']['cwd'];
                            }
            
                            for( var key in data )
                            {                                                        
                                var value_element = $( '.' + key + ' dd', this );

                                value_element
                                    .html( data[key] );
                                
                                value_element.closest( 'li' )
                                    .show();
                            }

                            var cmd_arg_key_element = $( '.command_line_args dt', this );
                            var cmd_arg_element = $( '.command_line_args dd', this );

                            for( var key in app.dashboard_values['jvm']['jmx']['commandLineArgs'] )
                            {
                                cmd_arg_element = cmd_arg_element.clone();
                                cmd_arg_element.html( app.dashboard_values['jvm']['jmx']['commandLineArgs'][key] );

                                cmd_arg_key_element
                                    .after( cmd_arg_element );
                            }

                            cmd_arg_key_element.closest( 'li' )
                                .show();

                            $( '.command_line_args dd:last', this )
                                .remove();

                            $( '.timeago', this )
                                .timeago();

                            $( 'li:visible:odd', this )
                                .addClass( 'odd' );

                            $( '.command_line_args dd:odd', this )
                                .addClass( 'odd' );
                            
                            // -- memory bar

                            var max_height = Math.round( $( '#memory-bar-max', this ).height() );
                            var total_height = Math.round( ( memory_data['memory-bar-total'] * max_height ) / memory_data['memory-bar-max'] );
                            var used_height = Math.round( ( memory_data['memory-bar-used'] * max_height ) / memory_data['memory-bar-max'] );

                            var memory_bar_total_value = $( '#memory-bar-total span', this ).first();

                            $( '#memory-bar-total', this )
                                .height( total_height );
                            
                            $( '#memory-bar-used', this )
                                .height( used_height );

                            if( used_height < total_height + memory_bar_total_value.height() )
                            {
                                memory_bar_total_value
                                    .addClass( 'upper' )
                                    .css( 'margin-top', memory_bar_total_value.height() * -1 );
                            }

                            var memory_percentage = ( ( memory_data['memory-bar-used'] / memory_data['memory-bar-max'] ) * 100 ).toFixed(1);
                            var headline = $( '#memory h2 span', this );
                                
                            headline
                                .html( headline.html() + ' (' + memory_percentage + '%)' );

                            $( '#memory-bar .value', this )
                                .each
                                (
                                    function()
                                    {
                                        var self = $( this );

                                        var byte_value = parseInt( self.html() );

                                        self
                                            .attr( 'title', 'raw: ' + byte_value + ' B' );

                                        byte_value /= 1024;
                                        byte_value /= 1024;
                                        byte_value = byte_value.toFixed( 2 ) + ' MB';

                                        self
                                            .html( byte_value );
                                    }
                                );
                            
                            // -- zookeeper tree

                            var zookeeper_element = $( '#zookeeper', this );

                            var has_zookeeper = false;
                            zookeeper_element.hide();

                            for( var key in app.dashboard_values['jvm']['jmx']['commandLineArgs'] )
                            {
                                if( 0 === app.dashboard_values['jvm']['jmx']['commandLineArgs'][key].indexOf( '-Dzk' ) )
                                {
                                    has_zookeeper = true;
                                    break;
                                }
                            }

                            if( has_zookeeper )
                            {
                                zookeeper_element
                                    .show();

                                $.ajax
                                (
                                    {
                                        url : app.config.zookeeper_path,
                                        dataType : 'json',
                                        context : $( '.content', zookeeper_element ),
                                        beforeSend : function( xhr, settings )
                                        {
                                            this
                                                .html( '<div class="loader">Loading ...</div>' );
                                        },
                                        success : function( response, text_status, xhr )
                                        {
                                            this
                                                .html( '<div id="zookeeper-tree" class="tree"></div>' );
                                            
                                            $( '#zookeeper-tree', this )
                                                .jstree
                                                (
                                                    {
                                                        "plugins" : [ "json_data" ],
                                                        "json_data" : {
                                                            "data" : response.tree,
                                                            "progressive_render" : true
                                                        },
                                                        "core" : {
                                                            "animation" : 0
                                                        }
                                                    }
                                                );
                                        },
                                        error : function( xhr, text_status, error_thrown)
                                        {
                                        },
                                        complete : function( xhr, text_status )
                                        {
                                        }
                                    }
                                );
                            }
                        },
                        error : function( xhr, text_status, error_thrown)
                        {
                        },
                        complete : function( xhr, text_status )
                        {
                        }
                    }
                );
            }
        );
    }
);

var solr_admin = function()
{
    menu_element = null,

    is_multicore = null,
    active_core = null,
    environment_basepath = null,

    config = null,
    params = null,
    dashboard_values = null,
    schema_browser_data = null,
    
    this.init_menu = function()
    {
        $( '.ping a', this.menu_element )
            .live
            (
                'click',
                function()
                {
                    sammy.trigger
                    (
                        'ping',
                        { element : this }
                    );
                    return false;
                }
            );
        
        $( 'a[rel]', this.menu_element )
            .live
            (
                'click',
                function()
                {
                    location.href = this.rel;
                    return false;
                }
            );
    }
    
    this.__construct = function()
    {
        this.menu_element = $( '#menu ul' );
        
        this.init_menu();
    }
    this.__construct();
}

var app;
$( document ).ready
(
    function()
    {
        jQuery.timeago.settings.allowFuture = true;
        
        app = new solr_admin();
        app.config = app_config;

        $.ajax
        (
            {
                url : app.config.solr_path + app.config.core_admin_path + '?wt=json',
                dataType : 'json',
                beforeSend : function( arr, form, options )
                {               
                    $( '#content' )
                        .html( '<div id="index"><div class="loader">Loading ...</div></div>' );
                },
                success : function( response )
                {
                    app.is_multicore = 'undefined' === typeof response.status[''];

                    for( var core_name in response.status )
                    {
                        var core_path = app.config.solr_path + '/' + core_name;

                        if( !core_name )
                        {
                            core_name = 'singlecore';
                            core_path = app.config.solr_path
                        }

                        if( !app.environment_basepath )
                        {
                            app.environment_basepath = core_path;
                        }

                        var core_tpl = '<li id="' + core_name + '" data-basepath="' + core_path + '">' + "\n"
                                     + '    <p><a href="#/' + core_name + '">' + core_name + '</a></p>' + "\n"
                                     + '    <ul>' + "\n"

                                     + '        <li class="query"><a rel="#/' + core_name + '/query"><span>Query</span></a></li>' + "\n"
                                     + '        <li class="schema"><a href="' + core_path + '/admin/file/?file=schema.xml" rel="#/' + core_name + '/schema"><span>Schema</span></a></li>' + "\n"
                                     + '        <li class="config"><a href="' +core_path + '/admin/file/?file=solrconfig.xml" rel="#/' + core_name + '/config"><span>Config</span></a></li>' + "\n"
                                     + '        <li class="replication optional"><a href="' + core_path + '/admin/replication/index.jsp"><span>Replication</span></a></li>' + "\n"
                                     + '        <li class="analysis"><a href="' + core_path + '/admin/analysis.jsp?highlight=on" rel="#/' + core_name + '/analysis"><span>Analysis</span></a></li>' + "\n"
                                     + '        <li class="schema-browser"><a href="' + core_path + '/admin/schema.jsp" rel="#/' + core_name + '/schema-browser"><span>Schema Browser</span></a></li>' + "\n"
                                     + '        <li class="stats"><a href="' +core_path + '/admin/stats.jsp" rel="#/' + core_name + '/info/stats"><span>Statistics</span></a></li>' + "\n"
                                     + '        <li class="ping"><a href="' + core_path + '/admin/ping"><span>Ping</span></a></li>' + "\n"
                                     + '        <li class="plugins"><a href="' + core_path + '/admin/plugins" rel="#/' + core_name + '/info"><span>Plugins</span></a></li>' + "\n"
                                     + '        <li class="dataimport"><a rel="#/' + core_name + '/dataimport"><span>Dataimport</span></a></li>' + "\n"

                                     + '    </ul>' + "\n"
                                     + '</li>';

                        app.menu_element
                            .append( core_tpl );
                    }

                    $.ajax
                    (
                        {
                            url : app.environment_basepath + '/admin/system?wt=json',
                            dataType : 'json',
                            context : $( '#environment' ),
                            beforeSend : function( arr, form, options )
                            {
                                this
                                    .show();
                                
                                loader.show( this );
                            },
                            success : function( response )
                            {
                                app.dashboard_values = response;
                                sammy.run( location.hash );

                                var environment_args = null;

                                if( response.jvm && response.jvm.jmx && response.jvm.jmx.commandLineArgs )
                                {
                                    environment_args = response.jvm.jmx.commandLineArgs.join( ' | ' )
                                                            .match( /-Dsolr.environment=((dev|test|prod)?[\w\d]*)/i );
                                }

                                if( !environment_args )
                                {
                                    this
                                        .hide();
                                }

                                if( environment_args && environment_args[1] )
                                {
                                    this
                                        .html( environment_args[1] );
                                }

                                if( environment_args && environment_args[2] )
                                {
                                    this
                                        .addClass( environment_args[2] );
                                }
                            },
                            error : function()
                            {
                                this
                                    .remove();
                            },
                            complete : function()
                            {
                                loader.hide( this );
                            }
                        }
                    );
                },
                error : function()
                {
                },
                complete : function()
                {
                }
            }
        );
    }
);  