using api;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;

var allowAllOrigins = "_allowAllOrigins";

var builder = WebApplication.CreateBuilder(args);

// Add diagnostic logging
Console.WriteLine($"Current directory: {Directory.GetCurrentDirectory()}");
Console.WriteLine($"Configuration base path: {builder.Environment.ContentRootPath}");
Console.WriteLine(
    $"Looking for appsettings.json in: {Path.Combine(builder.Environment.ContentRootPath, "appsettings.json")}");

builder.Services.AddCors(options =>
{
    options.AddPolicy(name: allowAllOrigins,
        policy =>
        {
            policy.AllowAnyOrigin();
            policy.AllowAnyHeader();
            policy.AllowAnyMethod();
        });
});

// Add services to the container.
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddDbContext<EloballContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));
var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseCors(allowAllOrigins);
app.UseAuthorization();

app.MapControllers();

app.Run();