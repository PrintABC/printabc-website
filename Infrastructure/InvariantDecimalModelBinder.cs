using Microsoft.AspNetCore.Mvc.ModelBinding;
using Microsoft.AspNetCore.Mvc.ModelBinding.Binders;
using System.Globalization;

//normalize inputs with decmial numbers to always be perceived as X.Y even for cultures where decimal is X,Y
public class InvariantDecimalModelBinder : IModelBinder
{
    private readonly IModelBinder _fallbackBinder;

    public InvariantDecimalModelBinder(IModelBinder fallbackBinder)
    {
        _fallbackBinder = fallbackBinder;
    }

    public async Task BindModelAsync(ModelBindingContext bindingContext)
    {
        var valueResult = bindingContext.ValueProvider.GetValue(bindingContext.ModelName);
        if (valueResult == ValueProviderResult.None)
        {
            await _fallbackBinder.BindModelAsync(bindingContext);
            return;
        }

        bindingContext.ModelState.SetModelValue(bindingContext.ModelName, valueResult);

        var valueAsString = valueResult.FirstValue;
        if (string.IsNullOrWhiteSpace(valueAsString))
        {
            return;
        }

        var normalized = valueAsString.Trim().Replace(',', '.');

        if (decimal.TryParse(normalized, NumberStyles.Number | NumberStyles.AllowExponent, CultureInfo.InvariantCulture, out var result))
        {
            bindingContext.Result = ModelBindingResult.Success(result);
        }
        else
        {
            bindingContext.ModelState.TryAddModelError(bindingContext.ModelName, "The value is not a valid number.");
        }
    }
}

public class InvariantDecimalModelBinderProvider : IModelBinderProvider
{
    public IModelBinder? GetBinder(ModelBinderProviderContext context)
    {
        if (context == null) throw new ArgumentNullException(nameof(context));

        if (context.Metadata.ModelType == typeof(decimal) || context.Metadata.ModelType == typeof(decimal?))
        {
            var loggerFactory = context.Services.GetRequiredService<ILoggerFactory>();
            return new InvariantDecimalModelBinder(
                new SimpleTypeModelBinder(context.Metadata.ModelType, loggerFactory));
        }

        return null;
    }
}