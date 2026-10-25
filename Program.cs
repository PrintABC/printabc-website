using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.Localization;
using Microsoft.AspNetCore.Mvc.ApplicationModels;
using Microsoft.AspNetCore.Mvc.Razor;
using PrintABC.Services;
using PrintABC.Utils;
using System.Globalization;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace PrintABC
{
    public class Program
    {
        public static void Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);

            builder.Services.AddLocalization(options => options.ResourcesPath = "Resources");

            builder.Services.AddRazorPages(options =>
            {
                //detect whether website urls are prefixed with /ru/
                options.Conventions.AddFolderRouteModelConvention("/", model =>
                {
                    foreach (var selector in model.Selectors.ToList())
                    {
                        var template = selector.AttributeRouteModel?.Template;

                        model.Selectors.Add(new SelectorModel
                        {
                            AttributeRouteModel = new AttributeRouteModel
                            {
                                Template = "{culture:regex(^(ru)$)}/" + template
                            }
                        });
                    }
                });
            })
            .AddMvcOptions(
            options =>
            {
                options.ModelBinderProviders.Insert(0, new InvariantDecimalModelBinderProvider());
            })
            .AddJsonOptions(o => o.JsonSerializerOptions.Converters.Add(
                new JsonStringEnumConverter(JsonNamingPolicy.SnakeCaseLower)))
            .AddViewLocalization(LanguageViewLocationExpanderFormat.Suffix)
            .AddDataAnnotationsLocalization();

            builder.Services.AddSingleton<StickerCalculatorService>();

            builder.Services.Configure<RequestLocalizationOptions>(options =>
            {
                var supportedCultures = new[]
                {
                    new CultureInfo("he"),
                    new CultureInfo("ru")
                };

                options.DefaultRequestCulture = new RequestCulture("he");
                options.SupportedCultures = supportedCultures;
                options.SupportedUICultures = supportedCultures;

                //remove default providers (cookies, headers, query string)
                options.RequestCultureProviders.Clear();

                //only using the path provider
                options.RequestCultureProviders.Add(new UrlPathCultureProvider());
            });

            builder.Services.Configure<ForwardedHeadersOptions>(o =>
            {
                o.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
                o.KnownIPNetworks.Clear();
                o.KnownProxies.Clear();
            });
            

            var app = builder.Build();

            app.UseForwardedHeaders();

            // Configure the HTTP request pipeline.
            if (!app.Environment.IsDevelopment())
            {
                app.UseExceptionHandler("/Error");
                // The default HSTS value is 30 days. You may want to change this for production scenarios, see https://aka.ms/aspnetcore-hsts.
                app.UseHsts();
            }

            app.UseHttpsRedirection();

            //app.Use(async (ctx, next) =>
            //{
            //    var h = ctx.Response.Headers;
            //    h["X-Content-Type-Options"] = "nosniff";
            //    h["Referrer-Policy"] = "strict-origin-when-cross-origin";
            //    h["X-Frame-Options"] = "DENY";
            //    h["Content-Security-Policy"] =
            //    "default-src 'self'; script-src 'self'; style-src 'self' https://fonts.googleapis.com; " +
            //    "font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self'; " +
            //    "form-action 'self'; frame-ancestors 'none'; base-uri 'self'; object-src 'none'";
            //    await next();
            //});

            app.UseRouting();
            //after routing so that the information is available
            app.UseRequestLocalization();

            app.UseAuthorization();

            app.MapStaticAssets();
            app.MapRazorPages()
               .WithStaticAssets();

            app.Run();
        }
    }
}
