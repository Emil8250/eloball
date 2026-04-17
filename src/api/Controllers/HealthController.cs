using Microsoft.AspNetCore.Mvc;

namespace api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class HealthController(ILogger<HealthController> logger) : ControllerBase
{

    [HttpGet]
    public string Get()
    {
        return "alive";
    }
}
