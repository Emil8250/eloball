using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace api.Controllers;

[ApiController]
[Route("api/[controller]")]
[AllowAnonymous]
public class HealthController(ILogger<HealthController> logger) : ControllerBase
{

    [HttpGet]
    public string Get()
    {
        return "alive";
    }
}
